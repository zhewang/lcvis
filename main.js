var express = require('express');
var app = express();

app.use(express.static('public'));

app.get('/', function (req, res) {
    res.sendfile('index.html');
});

app.get('/plotnew', function (req, res) {
    var msg = {'x':10, 'y':-20};
    res.send(msg);
});

app.listen(8000);
