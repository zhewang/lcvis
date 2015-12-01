import json
import csv

dat_json = {'data': {}}
fit_json = {'data': {}}
error_json = {'data': {}}

phase = [0.0, 0.02040816326530612, 0.04081632653061224, 0.061224489795918366, 0.08163265306122448, 0.1020408163265306, 0.12244897959183673, 0.14285714285714285, 0.16326530612244897, 0.18367346938775508, 0.2040816326530612, 0.22448979591836732, 0.24489795918367346, 0.26530612244897955, 0.2857142857142857, 0.3061224489795918, 0.32653061224489793, 0.3469387755102041, 0.36734693877551017, 0.3877551020408163, 0.4081632653061224, 0.42857142857142855, 0.44897959183673464, 0.4693877551020408, 0.4897959183673469, 0.5102040816326531, 0.5306122448979591, 0.5510204081632653, 0.5714285714285714, 0.5918367346938775, 0.6122448979591836, 0.6326530612244897, 0.6530612244897959, 0.673469387755102, 0.6938775510204082, 0.7142857142857142, 0.7346938775510203, 0.7551020408163265, 0.7755102040816326, 0.7959183673469387, 0.8163265306122448, 0.836734693877551, 0.8571428571428571, 0.8775510204081632, 0.8979591836734693, 0.9183673469387754, 0.9387755102040816, 0.9591836734693877, 0.9795918367346939, 1.0]

with open('./data/object_list.csv', newline='') as csvfile:
    objects = csv.reader(csvfile)
    next(objects, None)
    for row in objects:
        obj_id = int(row[0])
        period = float(row[1])
        print("Processing {}".format(obj_id))
        if period > 0:
            ## Original light curve
            #dat = json.load(open('./data/'+str(obj_id)+'.dat.json'))
            #dat_json['data'][str(obj_id)] = {'bands':['V'], 'V':dat}

            ## Fitted light curve
            #fit = json.load(open('./data/'+str(obj_id)+'.fit.json'))
            #fit_json['data'][str(obj_id)] = {'bands':['V'], 'V': {'mag':fit[0]['mag']}}

            # Fitted error
            error = json.load(open('./data/'+str(obj_id)+'.error.json'))
            for i in range(len(error)):
                if error[i] != error[i]:
                    error[i] = 0
            error_json['data'][str(obj_id)] = {'bands':['V'], 'V': error}

fit_json['phase'] = phase
error_json['phase'] = phase

#f = open('dat.json', 'w')
#f.write(json.dumps(dat_json))
#f.close()

#f = open('fit.json', 'w')
#f.write(json.dumps(fit_json))
#f.close()

f = open('fit_error.json', 'w')
f.write(json.dumps(error_json))
f.close()
