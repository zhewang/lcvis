import json
import numpy as np
import pca

from flask import Flask, request, jsonify, render_template, url_for


app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/supernova')
def supernova():
    return render_template('supernova.html')

@app.route('/new')
def splinenew():
    return render_template('index_new.html')

@app.route('/plotusers', methods=['post'])
def plotusers():
    data = request.get_json()
    position = po.project(data['lc'], data['p'])
    return jsonify(position)

@app.route('/fastpca')
def fastpca():
    return render_template('fastpca.html')

@app.route('/calculatepca', methods=['post'])
def calculatepca():
    uids = request.get_json()
    # TODO: calculate pca
    idlist, matrix, status = get_data_by_id(uids)
    pca_result = {}
    if status == 'ok':
        pca_result = pca.calculate(idlist, matrix)
    return jsonify({'status':status, 'data':pca_result})


def load_lc_data():
    lcdata = {}
    surveys = json.load(open("./static/data/list.json"))['surveys']
    for s in surveys:
        path = "./static/data/lightcurves/{}/fit.json".format(s)
        data = json.load(open(path))
        for objid in data['data']:
            lcdata[objid] = data['data'][objid]
    return lcdata

def get_data_by_id(ids, band='V'):
    global LCDATA
    ids_exist = []  # some id may not have lc data
    matrix = []
    status = 'ok'
    for i in ids:
        if i in LCDATA:
            if band in LCDATA[i]['bands']:
                vec = LCDATA[i][band]['mag']
                if len(vec) > 0:
                    ids_exist.append(i)
                    matrix.append(LCDATA[i][band]['mag'])

    if len(matrix) == 0:
        return ids_exist, matrix, 'no light curve data'

    c_length = len(matrix[0])
    matrix = np.array(matrix)
    if len(matrix) < c_length:
        status = "numrows < numcols"
    else:
        try:
            matrix.shape = (len(matrix), c_length)
        except:
            status = "not all rows have same numcols"

    return ids_exist, matrix, status



LCDATA = load_lc_data()



app.run(port=8080, debug=True)
