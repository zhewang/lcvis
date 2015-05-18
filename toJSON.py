import argparse
import json
import os


def DatToJson(fname):
    data = []

    f_in = open(fname, 'r')
    for line in f_in.readlines():
        data.append(line.split())

    f_out = open(fname+'.json', 'w')
    f_out.write(json.dumps(data, sort_keys=True, indent=4))

    f_in.close()
    f_out.close()


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('path', help='path to dataset folder')
    args = parser.parse_args()

    for root, dirs, files in os.walk(args.path):
        for f in files:
            if f.endswith('.dat'):
                DatToJson(args.path+'/'+f)
