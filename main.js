var express = require('express');
var process = require('child_process');
var bodyParser = require('body-parser');

var app = express();

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.get('/', function(req, res) {
  res.sendfile('index.html');
});

app.post('/plotusers', function(req, res) {
  var lcdata = JSON.stringify(req.body.lc).replace(/\"/g, '\\\"'); var period = 10;
  var period = req.body.p;

  var p = process.spawn(
    'python3',
    [
        '/Users/zhe/Projects/lcvis/python_scripts/process_object.py',
        '\"'+lcdata+'\"',
        period
    ]
  );

  p.stdout.on('data', function(data) {
    console.log(JSON.parse(data));
    res.send(data);
  });
});

app.listen(8000);
