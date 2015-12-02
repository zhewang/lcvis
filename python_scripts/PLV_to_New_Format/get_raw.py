import argparse
import csv
import json
import os
import numpy as np
import warnings


parser = argparse.ArgumentParser()
parser.add_argument('metafile')
args = parser.parse_args()

GLOBAL_PHASE = np.linspace(0, 1, num = 50).tolist()

with open(args.metafile) as f:
    meta = json.load(f)

    raw = {"data":{}}

    for obj in meta['data']:
        if obj['P'] != 'null':
            raw_json= "./lightcurves/{}/raw/{}.dat.json"\
                    .format(meta['survey'], obj['uid'])
            if os.path.exists(raw_json):
                raw['data'][obj['uid']] = json.load(open(raw_json))
            else:
                print('{} does not exist'.format(obj['uid']))
        else:
            print('{} does not have period'.format(obj['uid']))


    f_out = open('./lightcurves/{}/dat.json'.format(meta['survey']), 'w')
    f_out.write(json.dumps(raw))
    f_out.close()
