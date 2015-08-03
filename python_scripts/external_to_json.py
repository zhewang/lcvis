#!/usr/bin/env python
import sys
import json
import csv
import argparse

def SingleRow(inputfile):
    try:
        f = open(inputfile, 'r')
    except:
        print("No data for {}".format(obj_id))
        return

    data = f.readlines()
    f.close()

    if len(data) != 3:
        return

    line_0 = data[0].replace('\n', '').split('\t')
    line_2 = data[2].replace('\n', '').split('\t')
    row = {t:v for t, v in zip(line_0, line_2)}

    #with open(outfile, 'w') as f:
        #f.write(json.dumps(row))
    return row

def MultiRow(inputfile):
    try:
        f = open(inputfile, 'r')
    except:
        print("No data for {}".format(obj_id))
        return

    data = f.readlines()
    f.close()

    title = data[0].replace('\n', '').split('\t')
    rows = []
    for i in range(2, len(data)):
        row = data[i].replace('\n', '').split('\t')
        row = {t:v for t, v in zip(title, row)}
        rows.append(row)

    #with open(outfile, 'w') as f:
        #f.write(json.dumps(rows))
    return rows


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('path', help='path to dataset folder')
    args = parser.parse_args()

    with open('object_list.csv'.format(args.path), newline='') as csvfile:
        objects = csv.reader(csvfile)
        next(objects, None)
        for row in objects:
            obj_id = int(row[0])
            print("Processing {}".format(obj_id))
            IRSA = SingleRow(args.path+'/'+str(obj_id)+'_IRSA.dat')
            IRSADUST = MultiRow(args.path+'/'+str(obj_id)+'_IRSADUST.dat')
            NED = SingleRow(args.path+'/'+str(obj_id)+'_NED.dat')
            SIMBAD = SingleRow(args.path+'/'+str(obj_id)+'_SIMBAD.dat')
            data = {'IRSA': IRSA, 'IRSADUST': IRSADUST, 'NED': NED, 'SIMBAD': SIMBAD}
            with open(args.path+'_json/'+str(obj_id)+'.external.json', 'w') as f:
                f.write(json.dumps(data))

