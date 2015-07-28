import argparse
import csv
import json
import pickle
import numpy as np
from matplotlib.mlab import PCA

def loadMagData(fileName):
    data_file = open(fileName, 'r')
    data = json.load(data_file)
    mag = np.array(data[0]["mag"])
    phase = np.array(data[0]["phase"])

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
    parser.add_argument('path', help='path to dataset folder')
    args = parser.parse_args()

    f = open(args.path+'/SplinedataB.txt', 'r')
    BandB = json.load(f)
    f = open(args.path+'/SplinedataR.txt', 'r')
    BandR = json.load(f)
    f = open(args.path+'/SplinedataU.txt', 'r')
    BandU = json.load(f)
    f = open(args.path+'/SplinedataV.txt', 'r')
    BandV = json.load(f)

    BandB_sampled = {i['id']: i for i in BandB}
    BandR_sampled = {i['id']: i for i in BandR}
    BandU_sampled = {i['id']: i for i in BandU}
    BandV_sampled = {i['id']: i for i in BandV}

    matrix_with_id = {}

    for i in BandB_sampled:
        #if i in BandR_sampled and i in BandU_sampled and i in BandV_sampled:
        matrix_with_id[i] = BandB_sampled[i]['spldata_sampled']

    #for i in matrix_with_id:
        #matrix_with_id[i] = BandB_sampled[i]+BandR_sampled[i]+BandU_sampled[i]+BandV_sampled[i]


    obj_ids = []
    matrix = []
    row_length = 40
    for i in matrix_with_id:
        obj_ids.append(i)
        matrix.append(matrix_with_id[i])
        if len(matrix_with_id[i]) != row_length:
            print('row length is not {}'.format(row_length))

    # PCA calculating
    vec = np.array(matrix)
    vec.shape = (len(matrix), row_length)
    results = PCA(vec)

    data = []

    for obj_id, row in zip(obj_ids, matrix):
        obj_type = BandB_sampled[obj_id]["stype"]
        data.append([results.project(row)[0], results.project(row)[1], obj_type, obj_id])

    f_out = open(args.path+'/pca_supernova.json', 'w')
    f_out.write(json.dumps(data))
    f_out.close()

    #matrix = []
    #j = json.load(open('{}/PLV_LINEAR.json'.format(args.path)))

    #metadata = dict((obj["LINEARobjectID"], obj) for obj in j["data"])
    #obj_ids = []

    #row_length = 50

    #with open('{}/object_list.csv'.format(args.path)) as csvfile:
        #objects = csv.reader(csvfile)
        #next(objects, None)
        #for row in objects:
            #obj_id = int(row[0])
            #period = float(row[1])
            #if period > 0:
                #v = loadMagData(args.path+'/'+str(obj_id)+'.fit.json')
                #for i in range(row_length - len(v)):
                    #v.append(v[0])
                #matrix.append(v)
                #if obj_id == 16805607:
                    #f = open('16805607.realused.text', 'w')
                    #f.write(str(v))
                    #f.close()
                #obj_ids.append(obj_id)

    #vec = np.array(matrix)
    #vec.shape = (len(matrix), row_length)
    #results = PCA(vec)

    #with open('pca_result.dat', 'wb') as f:
        #pickle.dump(results, f)

    #with open('pca_matrix.dat', 'wb') as f:
        #pickle.dump(vec, f)

    #data = []

    #for obj_id, row in zip(obj_ids, matrix):
        #data.append([results.project(row)[0], results.project(row)[1], metadata[obj_id]["LCtype"], obj_id])

    #f_out = open(args.path+'/pca_supernova.json', 'w')
    #f_out.write(json.dumps(data))
    #f_out.close()
