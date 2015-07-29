import argparse
import csv
import json
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
    model.fit(xdata, ydata, Error)

    x = np.linspace(0, 1, num = 50).tolist()
    y = model.predict(x).tolist()

    data = [{"phase": [], "mag": []}]

    x, y = fillNaN(x, y)

    for i in range(len(y)):
        if y[i] == y[i]:
            data[0]["phase"].append(x[i])
            data[0]["mag"].append(y[i])

    residual = model.predict(xdata) - ydata

    return data, residual

def feature_derive(fileName, period, f_fit, f_residual):
    lc_file = open(fileName, 'r')
    lc_data = json.load(lc_file)

    fit_data, residual = fitcurve(lc_data, period)

    f_out = open(f_fit, 'w')
    f_out.write(json.dumps(fit_data, sort_keys=True, indent=4))
    f_out = open(f_residual, 'w')
    f_out.write(json.dumps(residual.tolist()))
    f_out.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('path', help='path to dataset folder')
    args = parser.parse_args()

    with open('{}/object_list.csv'.format(args.path), newline='') as csvfile:
        objects = csv.reader(csvfile)
        next(objects, None)
        for row in objects:
            obj_id = int(row[0])
            period = float(row[1])
            print("Fitting {}".format(obj_id))
            if period > 0:
                feature_derive(args.path+'/'+str(obj_id)+'.dat.json', period,
                               args.path+'/'+str(obj_id)+'.fit.json',
                               args.path+'/'+str(obj_id)+'.error.json')
