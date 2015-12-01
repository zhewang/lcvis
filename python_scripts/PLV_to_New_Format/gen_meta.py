import json

linear_list = json.load(open('PLV_LINEAR.json'))['data']
sdss_list = json.load(open('PLV_SDSS.json'))['data']

linear_dict = {}
for d in linear_list:
    linear_dict[d['LINEARobjectID']] = d

meta_list = []
for d in sdss_list:
    uid = d['LINEARobjectID']
    entry = linear_dict[uid]
    entry['uid'] = uid
    entry['ra'] = d['RA']
    entry['dec'] = d['Dec']
    meta_list.append(entry)

meta_json = {'data': meta_list}
f = open('linear_meta.json', 'w')
f.write(json.dumps(meta_json))
f.close()
