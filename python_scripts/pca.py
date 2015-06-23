import argparse
import csv
import json
import numpy as np
from matplotlib.mlab import PCA
from mag_data import loadMagData

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('path', help='path to dataset folder')
    args = parser.parse_args()

    matrix = []
    j = json.load(open('{}/PLV_LINEAR.json'.format(args.path)))

    metadata = dict((obj["LINEARobjectID"], obj) for obj in j["data"])
    obj_ids = []

    with open('{}/object_list.csv'.format(args.path)) as csvfile:
        objects = csv.reader(csvfile)
        next(objects, None)
        for row in objects:
            obj_id = int(row[0])
            period = float(row[1])
            if period > 0:
                v = loadMagData(args.path+'/'+str(obj_id)+'.fit.json')
                for i in range(50 - len(v)):
                    v.append(v[0])
                matrix.append(v)
                obj_ids.append(obj_id)

    vec = np.array(matrix)
    vec.shape = (len(matrix), 50)
    results = PCA(vec)

    data = []

    for obj_id, row in zip(obj_ids, matrix):
        data.append([results.project(row)[0], results.project(row)[1], metadata[obj_id]["LCtype"], obj_id])

    f_out = open(args.path+'/pca.json', 'w')
    f_out.write(json.dumps(data))
    f_out.close()
