import json

attrnames = ['field', 'ID', 'ra', 'dec', 'P', 't0', 'I', 'V_I', 'A', 'type', 'uid']
finaldata = []
ogle1_type = {'EW': 'ecl',
              'E': 'ecl',
              'EA': 'ecl',
              'EB': 'ecl',
              'EA?': 'ecl',
              'EW?': 'ecl',
              'E?': 'ecl',
              'EB?': 'ecl',
              'EA+': 'ecl',
              'EW+': 'ecl',
              'E+': 'ecl',
              'EB+': 'ecl',
              'EA-': 'ecl',
              'EW-': 'ecl',
              'E-': 'ecl',
              'EB-': 'ecl',

              'MIRA': 'misc',
              'MIRA?': 'misc',
              'MIRA+': 'misc',
              'MIRA-': 'misc',

              'ACEP': 'acep',
              'SXPHE': 'sxphe',

              'S': 'misc',
              'S?': 'misc',
              'S+': 'misc',
              'S-': 'misc',

              'MISC': 'misc',
              'MISC?': 'misc',
              'MISC+': 'misc',
              'MISC-': 'misc',

              'RRab': 'rrlyr',
              'RRab?': 'rrlyr',
              'RRc': 'rrlyr',
              'DSCT': 'dsct'}

def TimeToDegree(ra, dec):
    ra_parts = ra.split(':')
    ra_deg = int(ra_parts[0])*15 + \
             int(ra_parts[1])*0.25 + \
             float(ra_parts[2])/240.0

    dec_parts = dec.split(':')
    dec_deg = 0
    d1 = int(dec_parts[0])
    d2 = int(dec_parts[1])
    d3 = float(dec_parts[2])
    if dec[0] == '-':
        dec_deg = d1 - d2/60.0 - d3/3600.0
    else:
        dec_deg = d1 + d2/60.0 + d3/3600.0

    return round(ra_deg, 8), round(dec_deg, 8)


with open('ogle4_gsep.dat') as f:
    f.readline()
    data = []
    for line in f.readlines():
        cols = line.split()
        for i, col in enumerate(cols):
            if col == 'nan':
                cols[i] = 'null'
        cols[1] = cols[1][3:]  # ID: LMC1234 -> 1234
        row = {a:v for (v, a) in zip(cols, attrnames)}
        row['ra'], row['dec'] = TimeToDegree(row['ra'], row['dec'])
        uid = "{}_{}_{}".format('ogle4', row['field'], row['ID'])
        row['uid'] = uid
        data.append(row)
    finaldata = {"survey": 'ogle4', 'header':attrnames, 'data':data}
    with open('ogle4_meta.json', 'w') as f:
        f.write(json.dumps(finaldata))

with open('ogle2_ic1613_cep.dat') as f:
    f.readline()
    data = []
    for line in f.readlines():
        cols = line.split()
        for i, col in enumerate(cols):
            if col == 'nan':
                cols[i] = 'null'
        row = {a:v for (v, a) in zip(cols, attrnames)}
        row['ra'], row['dec'] = TimeToDegree(row['ra'], row['dec'])
        uid = "{}_{}_{}".format('ogle2', row['field'], row['ID'])
        row['uid'] = uid
        data.append(row)
    finaldata = {"survey": 'ogle2', 'header':attrnames, 'data':data}
    with open('ogle2_meta.json', 'w') as f:
        f.write(json.dumps(finaldata))

with open('ogle1_vars.dat') as f:
    f.readline()
    data = []
    for line in f.readlines():
        cols = line.split()
        for i, col in enumerate(cols):
            if col == 'nan':
                cols[i] = 'null'
        cols[9] = ogle1_type[cols[9]]  # Correct type, only for ogle1
        row = {a:v for (v, a) in zip(cols, attrnames)}
        row['ra'], row['dec'] = TimeToDegree(row['ra'], row['dec'])
        uid = "{}_{}_{}".format('ogle1', row['field'], row['ID'])
        row['uid'] = uid
        data.append(row)
    finaldata = {"survey": 'ogle1', 'header':attrnames, 'data':data}
    with open('ogle1_meta.json', 'w') as f:
        f.write(json.dumps(finaldata))

with open('ogle3_vars.dat') as f:
    f.readline()
    data = []
    for line in f.readlines():
        cols = line.split()
        for i, col in enumerate(cols):
            if col == 'nan':
                cols[i] = 'null'
        row = {a:v for (v, a) in zip(cols, attrnames)}
        row['ra'], row['dec'] = TimeToDegree(row['ra'], row['dec'])
        uid = row['ID'].lower()
        uid = uid[:4]+'3'+uid[4:]
        row['uid'] = uid.replace('-', '_')
        data.append(row)
    finaldata = {"survey": 'ogle3', 'header':attrnames, 'data':data}
    with open('ogle3_meta.json', 'w') as f:
        f.write(json.dumps(finaldata))

