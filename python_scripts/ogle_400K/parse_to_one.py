import argparse
import csv
import json
import os
import numpy as np
import warnings
# import matplotlib.pyplot as plt
from supersmoother import SuperSmoother
from scipy import interpolate

warnings.simplefilter('ignore')

#RAWLC = {}
FIT = {}
FITErr = {}

def fillNaN(x, y):
    length = len(x)
    yy = []
    for i in range(length):
        if 0*y[i] != 0*y[i]:
            for j in range(length):
                if y[j % length] == y[j % length]:
                    yy.append(y[j])
                    break
        else:
            yy.append(y[i])
    return x, yy

def fitcurve(lc_data_all_band, period):
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

        x = np.linspace(0, 1, num = 50).tolist()
        y = model.predict(x).tolist()

        data = [{"phase": [], "mag": []}]

        x, y = fillNaN(x, y)

        for i in range(len(y)):
            if y[i] == y[i]:
                data[0]["phase"].append(round(x[i], 6))
                data[0]["mag"].append(round(y[i], 6))

        residual = model.predict(xdata) - ydata
        error = []
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

def feature_derive(fileName, uid, period):
    # lc_data = {'bands': ['V', 'I'], 'V':[{},{},{},...], 'I':[{}, {}, ...]}
    lc_data = {'bands':[]}
    with open(fileName) as f:
        f.readline()
        for line in f.readlines():
            cols = line.split()
            if cols[3] not in lc_data['bands']:
                lc_data['bands'].append(cols[3])
                lc_data[cols[3]] = []
            else:
                lc_data[cols[3]].append({'time': cols[0],
                                         'mag': cols[1],
                                         'error': cols[2]})

    #RAWLC[uid] = lc_data

    fit_data, residual = fitcurve(lc_data, period)

    FIT[uid] = fit_data
    FITErr[uid] = residual

    return lc_data, fit_data, residual

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('metafile')
    args = parser.parse_args()

    with open(args.metafile) as f:
        meta = json.load(f)

        raw_dir = "./lightcurves/{}/raw/".format(meta['survey'])
        fit_dir = "./lightcurves/{}/fit/".format(meta['survey'])
        fit_error_dir = "./lightcurves/{}/fit_error/".format(meta['survey'])

        os.makedirs(os.path.dirname(raw_dir), exist_ok=True)
        #os.makedirs(os.path.dirname(fit_dir), exist_ok=True)
        #os.makedirs(os.path.dirname(fit_error_dir), exist_ok=True)

        for obj in meta['data']:
            if obj['P'] == obj['P']:
                prefix = obj['uid']
                dat_header = prefix
                if meta['survey'] == 'ogle4':
                    dat_header = "{}_{}{}".format('ogle4', obj['field'], obj['ID'])
                #print(prefix)

                lc_data_file = "./{}/{}.dat".format(obj['type'], dat_header)
                raw_json= "./lightcurves/{}/raw/{}.dat.json".format(meta['survey'], prefix)

                if os.path.exists(lc_data_file):
                    if obj['P'] != 'null':
                        raw_data, fit_data, fit_error = feature_derive(lc_data_file, obj['uid'], obj['P'])
                        f_out = open(raw_json, 'w')
                        f_out.write(json.dumps(raw_data))
                        f_out.close()
                else:
                    print('{} does not exist'.format(lc_data_file))
            else:
                print('{} does not exist'.format(lc_data_file))

        json_data = "./lightcurves/{}/raw.json".format(meta['survey'])
        f_fit = "./lightcurves/{}/fit.json".format(meta['survey'])
        f_residual = "./lightcurves/{}/fit_error.json".format(meta['survey'])

        #f_out = open(json_data, 'w')
        #f_out.write(json.dumps(RAWLC))
        #f_out.close()

        f_out = open(f_fit, 'w')
        f_out.write(json.dumps(FIT))
        f_out.close()

        f_out = open(f_residual, 'w')
        f_out.write(json.dumps(FITErr))
        f_out.close()
