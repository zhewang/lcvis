import argparse
import datetime
import csv
import json
import pickle
import sys
import numpy as np
from matplotlib.mlab import PCA

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
    surveys = ['ogle1', 'ogle2', 'ogle4']

    for s in surveys:
        path = "./lightcurves/{}/fit.json".format(s)
        data = json.load(open(path))
        for objid in data['data']:
            bands = data['data'][objid]['bands']
            if args.band in bands:
                vec = data['data'][objid][args.band]['mag']

                # phase is the same for all the objects in fitting data
                if GLOBAL_PHASE is None:
                    GLOBAL_PHASE = np.array(data['phase'], dtype=np.float32)
                if len(vec) == len(GLOBAL_PHASE):
                    obj_ids.append(objid)
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

    f_out = open('./pca.json', 'w')
    f_out.write(json.dumps(data))
    f_out.close()
