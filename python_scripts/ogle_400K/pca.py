import argparse
import datetime
import csv
import json
import pickle
import sys
import numpy as np
from matplotlib.mlab import PCA


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('path', help='Path to data file')
    parser.add_argument('band', help='Calculate on which band')
    args = parser.parse_args()

    GLOBAL_PHASE = None
    matrix = []
    obj_ids = []
    data = json.load(open(args.path))

    for objid in data['data']:
        bands = data['data'][objid]['bands']
        if args.band in bands:
            vec = data['data'][objid][args.band]['mag']

            # phase is the same for all the objects in fitting data
            if GLOBAL_PHASE is None:
                GLOBAL_PHASE = np.array(data['phase'], dtype=np.float32)
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