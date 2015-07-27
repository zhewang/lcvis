#!/usr/bin/env python
import argparse
import sys
import json
import pickle
import traceback
import numpy as np

from curve_fit import fitcurve
from matplotlib.mlab import PCA

def loadMagData(mag, phase):
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

    row_length = 50
    for i in range(row_length - len(result_mag)):
        result_mag.append(result_mag[0])

    return result_mag

def project(lc, p):
    lcdata = lc
    period = p

    sampled = fitcurve(lcdata, period)
    shifted_mag = loadMagData(sampled[0]['mag'], sampled[0]['phase'])

    with open('./pca_result.dat', 'rb') as f:
        pca_result = pickle.load(f)

    result = pca_result.project(shifted_mag)
    pos = {'x':result[0], 'y':result[1]}

    f.close()
    return pos

