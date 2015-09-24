import argparse
import datetime
import csv
import json
import pickle
import sys
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

    matrix = []
    j = json.load(open('{}/ogle.exists.list.json'.format(args.path)))

    metadata = dict((obj["ID"], obj) for obj in j)
    obj_ids = []

    row_length = 50

    for row in j:
        obj_id = row['ID']
        period = row['P']
        prefix = "{}_{}_{}".format(row['survey'], row['field'], row['ID'])
        if row['survey'] == 'ogle4':
            prefix = "{}_{}{}".format(row['survey'], row['field'], row['ID'])

        print(args.path+'/'+prefix+'.fit.json')
        v = loadMagData(args.path+'/'+prefix+'.fit.json')
        if len(v) <= 0:
            continue

        for i in range(row_length - len(v)):
            v.append(v[0])
        matrix.append(v)
        obj_ids.append(obj_id)

    j = json.load(open('data/PLV_LINEAR.json'))
    metadata.update(dict((obj["LINEARobjectID"], obj) for obj in j["data"]))


    with open('data/object_list.csv') as csvfile:
        objects = csv.reader(csvfile)
        next(objects, None)
        for row in objects:
            obj_id = int(row[0])
            period = float(row[1])
            if period > 0:
                v = loadMagData('./data/'+str(obj_id)+'.fit.json')
                for i in range(row_length - len(v)):
                    v.append(v[0])
                matrix.append(v)
                obj_ids.append(obj_id)

    print(len(matrix))

    vec = np.array(matrix)
    vec.shape = (len(matrix), row_length)

    t = datetime.datetime.now()
    timestamp = "{:02d}:{:02d}:{:02d}.{:06d}".format(t.hour,
                                                     t.minute,
                                                     t.second,
                                                     t.microsecond)

    print("{}: Calculating PCA...".format(timestamp))
    results = PCA(vec)
    t = datetime.datetime.now()
    timestamp = "{:02d}:{:02d}:{:02d}.{:06d}".format(t.hour,
                                                     t.minute,
                                                     t.second,
                                                     t.microsecond)
    print("{}: Done.".format(timestamp))

    data = []

    for obj_id, row in zip(obj_ids, matrix):
        objtype = ""
        if 'LCtype' in metadata[obj_id] :
            objtype = metadata[obj_id]['LCtype']
        else:
            objtype = metadata[obj_id]['type']
        data.append([results.project(row)[0], results.project(row)[1], objtype, obj_id])

    #with open('pca_result.dat', 'wb') as f:
        #pickle.dump(results, f)


    f_out = open('./pca.json', 'w')
    f_out.write(json.dumps(data))
    f_out.close()
