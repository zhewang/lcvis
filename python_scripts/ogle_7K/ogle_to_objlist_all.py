import json

attrnames = ['field', 'ID', 'ra', 'dec', 'P', 't0', 'I', 'V_I', 'A', 'type']
types = [str, str, str, str, float, float, float, float, float, str]
data = []
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

with open('ogle4_gsep.dat') as f:
    f.readline()
    for line in f.readlines():
        cols = line.split()

        for col in cols:
            if col == 'nan':
                flag = 'null'

        cols.append('ogle4')
        data.append(cols)

#with open('ogle2_ic1613_cep.dat') as f:
    #f.readline()
    #for line in f.readlines():
        #cols = line.split()
        #flag = False
        #for col in cols:
            #if col == 'nan':
                #flag = True
        #if flag is True:
            #continue
        #else:
            #row = {a:t(v) for (v, a, t) in zip(cols, attrnames, types)}
            #row['survey'] = 'ogle2'
            #data.append(row)

#with open('ogle1_vars.dat') as f:
    #f.readline()
    #for line in f.readlines():
        #cols = line.split()
        #flag = False
        #for col in cols:
            #if col == 'nan':
                #flag = True
        #if flag is True:
            #continue
        #else:
            #row = {a:t(v) for (v, a, t) in zip(cols, attrnames, types)}
            #row['survey'] = 'ogle1'
            #row['type'] = ogle1_type[row['type']]
            #data.append(row)

with open('ogle.list.json', 'w') as f:
    f.write(json.dumps(data, indent=4))

