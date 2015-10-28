#!/usr/bin/env python
import argparse
import sys
import json
import pickle

from matplotlib.mlab import PCA


with open('./pca_result.dat', 'rb') as f:
    pca_result = pickle.load(f)

f = open('eigenvalues.json', 'w')
f.write(json.dumps(pca_result.s.tolist()))
f.close()

f = open('eigenvectors.json', 'w')
f.write(json.dumps(pca_result.Wt.tolist()))
f.close()

