#!/usr/bin/env python
import argparse
import sys
import json
import pickle

from curve_fit import fitcurve
from matplotlib.mlab import PCA


parser = argparse.ArgumentParser()
parser.add_argument('lc',  help='light curve data')
parser.add_argument('p', help='period')
args = parser.parse_args()

lcdata = json.loads(args.lc)
lcdata = json.loads(lcdata)
period = float(args.p)

sampled = fitcurve(lcdata, period)

with open('./python_scripts/pca_result.dat', 'rb') as f:
    pca_result = pickle.load(f)

result = pca_result.project(sampled[0]["mag"])
pos = {'x':result[0], 'y':result[1]}
print(json.dumps(pos))

