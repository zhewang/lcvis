import argparse
import json

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('path', help='path to file')
    args = parser.parse_args()

    matrix = []
    j = json.load(open(args.path))
    j = list(x for x in j[1:] if x["band"] == "B")
    results = []
    for i in j:
        flag = True
        for d in i["splinedata"]:
            if d != d:
                flag = False
                break
        if flag is True:
            results.append(i)

    f_out = open('clean_splinedata.json', 'w')
    f_out.write(json.dumps(results))
    f_out.close()
