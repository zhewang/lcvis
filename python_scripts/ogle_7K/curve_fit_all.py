import argparse
import csv
import json
import os
import numpy as np
# import matplotlib.pyplot as plt
from supersmoother import SuperSmoother
from scipy import interpolate

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

def fitcurve(lc_data, period):
    Mag = np.array([i["mag"] for i in lc_data], dtype=np.float32)
    MJD = np.array([i["time"] for i in lc_data], dtype=np.float32)
    Error = np.array([i["error"] for i in lc_data], dtype=np.float32)
    t = MJD - MJD.min()
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
            data[0]["phase"].append(x[i])
            data[0]["mag"].append(y[i])

    residual = model.predict(xdata) - ydata
    error = []
    for e in residual:
        if e == e:
            error.append(e)

    return data, error

def feature_derive(fileName, period, json_data, f_fit, f_residual):
    lc_data = []
    with open(fileName) as f:
        f.readline()
        for line in f.readlines():
            cols = line.split()
            lc_data.append({'time': cols[0],
                            'mag': cols[1],
                            'error': cols[2],
                            'pb': cols[3]})

    fit_data, residual = fitcurve(lc_data, period)

    f_out = open(json_data, 'w')
    f_out.write(json.dumps(lc_data, sort_keys=True, indent=4))
    f_out.close()

    f_out = open(f_fit, 'w')
    f_out.write(json.dumps(fit_data, sort_keys=True, indent=4))
    f_out.close()

    f_out = open(f_residual, 'w')
    f_out.write(json.dumps(residual))
    f_out.close()

if __name__ == '__main__':

    existlist = []
    missing = 0
    with open('ogle.list.json') as f:
        objlist = json.load(f)
        for obj in objlist:
            if obj['P'] == obj['P']:
                prefix = "{}_{}_{}".format(obj['survey'], obj['field'], obj['ID'])
                print(prefix)
                if obj['survey'] == 'ogle4':
                    prefix = "{}_{}{}".format(obj['survey'], obj['field'], obj['ID'])
                lc_data_file = "./{}/{}.dat".format(obj['type'], prefix)
                json_data = "./{}.dat.json".format(prefix)
                f_fit = "./{}.fit.json".format(prefix)
                f_residual = "./{}.error.json".format(prefix)

                if os.path.exists(lc_data_file):
                    existlist.append(obj)
                    #feature_derive(lc_data_file, obj['P'], json_data, f_fit, f_residual)
                else:
                    missing = missing + 1
                    print('{} does not exist'.format(lc_data_file))


    print(missing)
    f_out = open('ogle.exists.list.json', 'w')
    f_out.write(json.dumps(existlist))
    f_out.close()
