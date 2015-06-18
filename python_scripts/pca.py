import argparse
import csv
import json
import numpy as np
from matplotlib.mlab import PCA


def findPeak(mag, phase):
    magPeak = 100
    phasePeak = -1
    for i in range(len(mag)):
        if mag[i] < magPeak:
            magPeak = mag[i]
            phasePeak = phase[i]

    if magPeak < 0.2:
        magPeakNeg = -100
        phasePeakNeg = -1
        for i in range(len(mag)):
            if mag[i] > magPeakNeg:
                magPeakNeg = mag[i]
                phasePeakNeg = phase[i]

        if abs(magPeakNeg) / abs(magPeak) > 3:
            return phasePeakNeg
        else:
            return phasePeak
    else:
        return phasePeak


def loadMagData(fileName):
    data_file = open(fileName, 'r')
    data = json.load(data_file)
    mag = np.array(data[0]["mag"])
    phase = np.array(data[0]["phase"])

    magScaled = mag - np.mean(mag)
    phasePeak = findPeak(magScaled, phase)

    shift = phasePeak - 0.3
    for i in range(len(phase)):
        phase[i] = phase[i] - shift
        if phase[i] > 1:
            phase[i] = phase[i] - 1
        elif phase[i] < 0:
            phase[i] = phase[i] + 1

    mag_phase_scaled = []
    for i in range(len(mag)):
        mag_phase_scaled.append([phase[i], magScaled[i]])

    sort_data = sorted(mag_phase_scaled, key=lambda l: l[0])
    result_mag = []
    for i in sort_data:
        result_mag.append(i[1])

    return result_mag

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
                matrix.append(v)
                obj_ids.append(obj_id)

    vec = np.array(matrix)
    vec.shape = (len(matrix), 50)
    results = PCA(vec)

    data = []

    for obj_id, row in zip(obj_ids, matrix):
        data.append([results.project(row)[0], results.project(row)[1],
                    metadata[obj_id]["LCtype"], obj_id])

    f_out = open(args.path+'/pca.json', 'w')
    f_out.write(json.dumps(data))
    f_out.close()
    f_out = open(args.path+'/pca_matrix.json', 'w')
    f_out.write(json.dumps(list(list(x) for x in results.Wt)))
    f_out.close()
