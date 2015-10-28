import argparse
import csv
import json
import numpy as np
from matplotlib.mlab import PCA
from mag_data import loadMagData

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('path', help='path to file')
    args = parser.parse_args()

    matrix = []
    j = json.load(open(args.path))
    j = list(x for x in j[1:] if x["band"] == "B")

    matrix = list(x["splinedata"] for x in j)
    
    # metadata = dict((obj["LINEARobjectID"], obj) for obj in j["data"])
    # obj_ids = []

    # with open('{}/object_list.csv'.format(args.path)) as csvfile:
    #     objects = csv.reader(csvfile)
    #     next(objects, None)
    #     for row in objects:
    #         obj_id = int(row[0])
    #         period = float(row[1])
    #         if period > 0:
    #             v = loadMagData(args.path+'/'+str(obj_id)+'.fit.json')
    #             for i in range(50 - len(v)):
    #                 v.append(v[0])
    #             matrix.append(v)
    #             obj_ids.append(obj_id)

    vec = np.array(matrix)
    vec.shape = (len(matrix), 20)
    results = PCA(vec)

    data = []

    for obj, row in zip(j, matrix):
        data.append([results.project(row)[0], results.project(row)[1], obj])

    f_out = open('pca_transients.json', 'w')
    f_out.write(json.dumps(data))
    f_out.close()
