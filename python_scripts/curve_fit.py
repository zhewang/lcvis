import argparse
import csv
import json
import numpy as np
# import matplotlib.pyplot as plt
from supersmoother import SuperSmoother


def fillNaN(x, y):
    length = len(x)
    yy = []
    for i in range(length):
        if y[i] != y[i]:
            for j in range(length):
                if y[j % length] == y[j % length]:
                    yy.append(y[j])
                    break
        else:
            yy.append(y[i])
    return x, yy


def fitCurve(fileName, period, saveFileName, errorFileName):
    lc_file = open(fileName, 'r')
    lc_data = json.load(lc_file)

    Mag = np.array([i["mag"] for i in lc_data])
    MJD = np.array([i["time"] for i in lc_data])
    t = MJD - MJD.min()
    phi = np.array([i/period - int(i/period) for i in t])

    xdata = phi
    ydata = Mag

    model = SuperSmoother()
    model.fit(xdata, ydata)

    ydataError = []
    for i in range(len(xdata)):
        y_predict = model.predict(xdata[i])
        error = ydata[i] - float(y_predict)
        ydataError.append(error)

    f_out = open(errorFileName, 'w')
    f_out.write(json.dumps(ydataError))
    f_out.close()

    x = np.linspace(0, 1).tolist()
    y = model.predict(x).tolist()


    data = [{"phase": [], "mag": []}]

    for i in range(len(y)):
        data[0]["phase"].append(x[i])
        data[0]["mag"].append(y[i])

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
            print("Fitting {}".format(obj_id))
            if period > 0:
                fitCurve(args.path+'/'+str(obj_id)+'.dat.json', period,
                         args.path+'/'+str(obj_id)+'.fit.json',
                         args.path+'/'+str(obj_id)+'.error.json')
