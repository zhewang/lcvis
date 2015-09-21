from flask import Flask, request, jsonify, render_template, url_for

import process_object as po

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

app.run(port=8080, debug=True)
