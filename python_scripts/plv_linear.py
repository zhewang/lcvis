#!/usr/bin/env python
import sys
import json

result = {}
lst = []
result["data"] = lst
types = [int, int, float, float, float, float, float, float, float, float, float, float, int, int, int]

while True:
    l = sys.stdin.readline().strip()
    if l == '':
        break
    if l.startswith('# LINEARobjectID'):
        cols = [x for x in l[2:].split(' ') if x <> '']
        continue
    elif l.startswith('#'):
        continue
    row = [x for x in l.split(' ') if x <> '']
    row = [t(v) for (v, t) in zip(row, types)]
    obj = dict((c, r) for (c, r) in zip(cols, row))
    lst.append(obj)

print json.dumps(lst)

