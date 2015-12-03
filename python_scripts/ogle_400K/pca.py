import argparse
import datetime
import csv
import json
import pickle
import sys
import numpy as np
from matplotlib.mlab import PCA


def normLC(mag, phase):
    mag = np.array(mag)
    phase = np.array(phase)

    magPeak = 100
    phasePeak = -1
    for i in range(len(mag)):
        if mag[i] < magPeak:
            magPeak = mag[i]
            phasePeak = phase[i]

    mag= mag - np.mean(mag)
    magPeak = 100
    phasePeak = -1
    iPeak = -1

    for i in range(len(mag)):
        if mag[i] < magPeak:
            magPeak = mag[i]
            iPeak = i
            #phasePeak = phase[i]

    mag = mag.tolist()
    result_mag = mag[iPeak:]+mag[:iPeak]

    return result_mag

def timestamp():
    t = datetime.datetime.now()
    time = "{:02d}:{:02d}:{:02d}.{:06d}".format(t.hour,
                                                t.minute,
                                                t.second,
                                                t.microsecond)
    return time



def pca(ids, matrix):
    print("{}: Calculating PCA...".format(timestamp()))

    results = PCA(matrix)

    pickle.dump(results, open('./pca_pickle.dat', 'w'))

    data = []

    for obj_id, row in zip(ids, matrix):
        data.append([round(results.project(row)[0],6),
                     round(results.project(row)[1],6),
                     obj_id])

    print("{}: Done.".format(timestamp()))
    return data



if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('band', help='Calculate on which band')
    args = parser.parse_args()

    GLOBAL_PHASE = None
    matrix = []
    obj_ids = []
    obj_types = {}
    surveys = ['linear', 'ogle1', 'ogle2', 'ogle4']

    for s in surveys:
        path = "./lightcurves/{}/fit.json".format(s)
        data = json.load(open(path))

        meta_path = '{}_meta.json'.format(s)
        meta = json.load(open(meta_path))
        for d in meta['data']:
            if s == "linear":
                obj_types[str(d['uid'])] = d['LCtype']
            else:
                obj_types[d['uid']] = d['type']

        for objid in data['data']:
            bands = data['data'][objid]['bands']
            if args.band in bands:
                vec = data['data'][objid][args.band]['mag']
                ksquare = 0
                if 'ksquare' in data['data'][objid][args.band]:
                    ksquare = data['data'][objid][args.band]['ksquare']

                # phase is the same for all the objects in fitting data
                if GLOBAL_PHASE is None:
                    GLOBAL_PHASE = np.array(data['phase'], dtype=np.float32)
                if len(vec) == len(GLOBAL_PHASE) and ksquare <= 3:
                    vec = normLC(vec, GLOBAL_PHASE)
                    obj_ids.append(objid)
                    if len(vec) != 50:
                        print(len(vec))
                    matrix.append(vec)
                else:
                    pass
                    #print('{} is empty.'.format(objid))

    print('{} rows'.format(len(obj_ids)))

    if GLOBAL_PHASE is None or len(obj_ids) < len(GLOBAL_PHASE):
        print("Not enough data in {} band for calculating PCA.".format(args.band))
        sys.exit(0)

    matrix = np.array(matrix)
    matrix.shape = (len(matrix), len(GLOBAL_PHASE))

    data = pca(obj_ids, matrix)

    for i in range(len(data)):
        data[i].append(str(obj_types[data[i][2]]))

    f_out = open('./pca.json', 'w')
    f_out.write(json.dumps(data))
    f_out.close()
