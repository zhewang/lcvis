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
    mag = (mag - np.mean(mag)).tolist()

    magPeak = 100
    phasePeak = -1
    iPeak = -1

    for i in range(len(mag)):
        if mag[i] < magPeak:
            magPeak = mag[i]
            iPeak = i
            #phasePeak = phase[i]

    result_mag = mag[iPeak:]+mag[:iPeak]

    return result_mag, iPeak


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
        ksquare = 0

        if len(y) > 0:
            y = fillNaN(y)
            y, shift = norm(y)
            y = [round(d, 6) for d in y]
            data["mag"] = y
            data['shift'] = shift

            residual = model.predict(xdata) - ydata
            for e in residual:
                if e != e:
                    error.append(0)
                elif e*0 != 0:
                    error.append(0)
                else:
                    error.append(round(e, 6))

            for i in range(len(error)):
                ksquare += error[i]**2 / Error[i]**2

            ksquare = ksquare / len(residual)
            data['ksquare'] = ksquare
            fitresults[band] = data
            fiterror[band] = error

    #return fitresults, fiterror, ksquare
    return fitresults, ksquare


def feature_derive(uid, period, raw_json):
    lc_data = json.load(open(raw_json))
    fit_data, ksquare = fitcurve(lc_data, period)
    return uid, fit_data, [], ksquare


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

        f_fit = "./lightcurves/{}/fit_with_ksquare.json".format(meta['survey'])

        f_out = open(f_fit, 'w')
        f_out.write(json.dumps(FIT))
        f_out.close()
