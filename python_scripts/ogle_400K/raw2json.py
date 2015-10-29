import argparse
import json
import os

from multiprocessing import Pool


def feature_derive(fileName, raw_json):
    # lc_data = {'bands': ['V', 'I'], 'V':[{},{},{},...], 'I':[{}, {}, ...]}
    global COUNTER
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

    f_out = open(raw_json, 'w')
    f_out.write(json.dumps(lc_data))
    f_out.close()

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('metafile')
    args = parser.parse_args()

    with open(args.metafile) as f:
        meta = json.load(f)

        raw_dir = "./lightcurves/{}/raw/".format(meta['survey'])
        os.makedirs(os.path.dirname(raw_dir), exist_ok=True)

        pool = Pool(4)
        parameters = []

        for obj in meta['data']:
            if obj['P'] != 'null':
                prefix = obj['uid']
                dat_header = prefix
                if meta['survey'] == 'ogle4':
                    dat_header = "{}_{}{}".format('ogle4', obj['field'], obj['ID'])

                lc_data_file = "./{}/{}.dat".format(obj['type'], dat_header)
                raw_json= "./lightcurves/{}/raw/{}.dat.json"\
                          .format(meta['survey'], prefix)

                if os.path.exists(lc_data_file):
                    parameters.append((lc_data_file,  raw_json,))
                else:
                    print('{} does not exist'.format(lc_data_file))
            else:
                print('{} does not exist'.format(lc_data_file))

        results = pool.starmap(feature_derive, parameters)
