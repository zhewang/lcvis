import argparse
import csv
import json
import numpy as np
# import matplotlib.pyplot as plt
from supersmoother import SuperSmoother


def fitCurve(fileName, period, saveFileName):
    lc_file = open(fileName, 'r')
    lc_data = json.load(lc_file)

    Mag = np.array([i["mag"] for i in lc_data])
    MJD = np.array([i["time"] for i in lc_data])
    t = MJD - MJD.min()
    phi = np.array([i/period - int(i/period) for i in t])

    xdata = np.hstack([phi-1, phi, phi+1])
    ydata = np.hstack([Mag, Mag, Mag])

    model = SuperSmoother(period=1)
    model.fit(xdata, ydata)

    x = np.linspace(-0.5, 1.5)

    data = []
    data.append({"phase": x.tolist(),
                "mag": model.predict(x).tolist()})
    f_out = open(saveFileName, 'w')
    f_out.write(json.dumps(data, sort_keys=True, indent=4))
    f_out.close()

    # plt.plot(x, model.predict(x))
    # plt.scatter(xdata, ydata)
    # plt.show()

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
            fitCurve(args.path+'/'+str(obj_id)+'.dat.json', period,
                     args.path+'/'+str(obj_id)+'.fit.json')
