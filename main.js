var express = require('express');
var process = require('child_process');
var bodyParser = require('body-parser');

var app = express();

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    res.sendfile('index.html');
});

app.post('/plotusers', function (req, res) {
    console.log(req.body);

    var p = process.spawn(
        'python3',
        ['/Users/zhe/Projects/lcvis/python_scripts/process_object.py']
    );

    p.stdout.on('data', function(data){
        res.send(data);
    });
});

app.listen(8000);
