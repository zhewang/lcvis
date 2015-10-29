import argparse
import csv
import json
import os
import numpy as np
import warnings

from multiprocessing import Pool
from supersmoother import SuperSmoother
from scipy import interpolate

warnings.simplefilter('ignore')

FIT = {}
FITErr = {}


def norm(mag):
    global GLOBAL_PHASE
    phase = GLOBAL_PHASE
    mag = mag - np.mean(mag)

    magPeak = 100
    phasePeak = -1

    for i in range(len(mag)):
        if mag[i] < magPeak:
            magPeak = mag[i]
            phasePeak = phase[i]

    shift = phasePeak - 0.3
    for i in range(len(phase)):
        phase[i] = phase[i] - shift
        if phase[i] > 1:
            phase[i] = phase[i] - 1
        elif phase[i] < 0:
            phase[i] = phase[i] + 1

    mag_phase_scaled = {}
    for i in range(len(mag)):
        mag_phase_scaled[phase[i]] = mag[i]

    sort_data = sorted(mag_phase_scaled.items())
    result_mag = []
    for i in sort_data:
        result_mag.append(i[1])

    return result_mag


def fillNaN(y):
    length = len(y)
    yy = []
    for i in range(length):
        if 0*y[i] != 0*y[i]:
            for j in range(length):
                if y[j % length] == y[j % length]:
                    yy.append(y[j])
                    break
        else:
            yy.append(y[i])
    return yy


def fitcurve(lc_data_all_band, period):
    global GLOBAL_PHASE
    fitresults = {'bands': lc_data_all_band['bands']}
    fiterror = {'bands': lc_data_all_band['bands']}
    for band in lc_data_all_band['bands']:
        lc_data = lc_data_all_band[band]
        Mag = np.array([float(i["mag"]) for i in lc_data], dtype=np.float32)
        MJD = np.array([float(i["time"]) for i in lc_data], dtype=np.float32)
        Error = np.array([float(i["error"]) for i in lc_data], dtype=np.float32)
        t = MJD - MJD.min()
        period = float(period)
        phi = np.array([i/period - int(i/period) for i in t])

        xdata = phi
        ydata = Mag

        model = SuperSmoother()
        model.fit(xdata, ydata)

        #x = np.linspace(0, 1, num = 50).tolist()
        x = GLOBAL_PHASE
        y = model.predict(x).tolist()

        data = {"mag": []}
        error = []

        if len(y) > 0:
            y = fillNaN(y)
            y = norm(y)
            y = [round(d, 6) for d in y]
            data["mag"] = y

            residual = model.predict(xdata) - ydata
            for e in residual:
                if e != e:
                    error.append(0)
                elif e*0 != 0:
                    error.append(0)
                else:
                    error.append(round(e, 6))


            fitresults[band] = data
            fiterror[band] = error

    return fitresults, fiterror


def feature_derive(uid, period, raw_json):
    lc_data = json.load(open(raw_json))
    fit_data, residual = fitcurve(lc_data, period)
    return uid, fit_data, residual


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('metafile')
    args = parser.parse_args()

    GLOBAL_PHASE = np.linspace(0, 1, num = 50).tolist()

    with open(args.metafile) as f:
        meta = json.load(f)

        parameters = []

        for obj in meta['data']:
            if obj['P'] != 'null':
                raw_json= "./lightcurves/{}/raw/{}.dat.json"\
                          .format(meta['survey'], obj['uid'])
                if os.path.exists(raw_json):
                    parameters.append((obj['uid'], obj['P'], raw_json,))
                else:
                    print('{} does not exist'.format(obj['uid']))
            else:
                print('{} does not have period'.format(obj['uid']))

        pool = Pool(4)
        results = pool.starmap(feature_derive, parameters)

        FIT['data'] = {}
        FIT['phase'] = np.linspace(0, 1, num = 50).tolist()
        FITErr['data'] = {}
        FITErr['phase'] = np.linspace(0, 1, num = 50).tolist()

        for result in results:
            FIT['data'][result[0]] = result[1]
            FITErr['data'][result[0]] = result[2]

        f_fit = "./lightcurves/{}/fit.json".format(meta['survey'])
        f_residual = "./lightcurves/{}/fit_error.json".format(meta['survey'])

        f_out = open(f_fit, 'w')
        f_out.write(json.dumps(FIT))
        f_out.close()

        f_out = open(f_residual, 'w')
        f_out.write(json.dumps(FITErr))
        f_out.close()
