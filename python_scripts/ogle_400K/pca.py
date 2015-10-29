import argparse
import datetime
import csv
import json
import pickle
import sys
import numpy as np
from matplotlib.mlab import PCA


def shift(mag):
    global GLOBAL_PHASE
    mag = np.array(mag, dtype=np.float32)
    phase = GLOBAL_PHASE

    magPeak = 100
    phasePeak = -1
    for i in range(len(mag)):
        if mag[i] < magPeak:
            magPeak = mag[i]
            phasePeak = phase[i]

    magScaled = mag - np.mean(mag)
    shift = phasePeak - 0.3
    for i in range(len(phase)):
        phase[i] = phase[i] - shift
        if phase[i] > 1:
            phase[i] = phase[i] - 1
        elif phase[i] < 0:
            phase[i] = phase[i] + 1

    mag_phase_scaled = {}
    for i in range(len(mag)):
        mag_phase_scaled[phase[i]] = magScaled[i]

    sort_data = sorted(mag_phase_scaled.items())
    result_mag = []
    for i in sort_data:
        result_mag.append(i[1])

    return result_mag


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('path', help='Path to data file')
    parser.add_argument('band', help='Calculate on which band')
    args = parser.parse_args()

    GLOBAL_PHASE = None
    matrix = []
    obj_ids = []
    data = json.load(open(args.path))

    for objid in data:
        bands = data[objid]['bands']
        if args.band in bands:
            vec = data[objid][args.band]['mag']

            # phase is the same for all the objects in fitting data
            if GLOBAL_PHASE is None:
                GLOBAL_PHASE = np.array(data[objid][args.band]['phase'],
                                        dtype=np.float32)
            if len(vec) != 0:
                obj_ids.append(objid)
                matrix.append(vec)
            else:
                print('{} is empty.'.format(objid))

    print('{} rows'.format(len(obj_ids)))

    if GLOBAL_PHASE is None or len(obj_ids) < len(GLOBAL_PHASE):
        print("Not enough data in {} band for calculating PCA.".format(args.band))
        sys.exit(0)

    matrix = np.array(matrix)
    matrix.shape = (len(matrix), len(GLOBAL_PHASE))

    t = datetime.datetime.now()
    timestamp = "{:02d}:{:02d}:{:02d}.{:06d}".format(t.hour,
                                                     t.minute,
                                                     t.second,
                                                     t.microsecond)

    print("{}: Calculating PCA...".format(timestamp))
    results = PCA(matrix)
    t = datetime.datetime.now()
    timestamp = "{:02d}:{:02d}:{:02d}.{:06d}".format(t.hour,
                                                     t.minute,
                                                     t.second,
                                                     t.microsecond)
    print("{}: Done.".format(timestamp))

    data = []

    for obj_id, row in zip(obj_ids, matrix):
        data.append([round(results.project(row)[0],6), round(results.project(row)[1],6), obj_id])

    #with open('pca_result.dat', 'wb') as f:
        #pickle.dump(results, f)


    f_out = open('./pca.json', 'w')
    f_out.write(json.dumps(data))
    f_out.close()
