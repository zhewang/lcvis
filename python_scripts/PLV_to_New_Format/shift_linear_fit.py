import argparse
import json
import sys
import numpy as np


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

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    args = parser.parse_args()

    GLOBAL_PHASE = None
    surveys = ['linear']

    for s in surveys:
        path = "./lightcurves/{}/fit.json".format(s)
        data = json.load(open(path))

        for objid in data['data']:
            band = 'V'
            vec = data['data'][objid][band]['mag']

            # phase is the same for all the objects in fitting data
            if GLOBAL_PHASE is None:
                GLOBAL_PHASE = np.array(data['phase'], dtype=np.float32)

            data['data'][objid][band]['mag'] = normLC(vec, GLOBAL_PHASE)

        f_out = open('./fit.json', 'w')
        f_out.write(json.dumps(data))
        f_out.close()
