var express = require('express');
var mysql = require('mysql');
var config = require('./config/config');
var connection = mysql.createConnection(config);

// connection.connect();
var app = express();

app.set('port', process.env.PORT || 3000);

app.get('/', function(req, res){
    res.send('Root');
});

// 그룹 합수, 집계 함수
app.get('/action', function(req, res){
    connection.query('SELECT * from action_table_g', function(err, rows) {
        if(err) throw err;

        console.log('The solution is: ', rows);
        res.send(rows);
    });
});

app.get('/action/time', function(req, res){
    connection.query('SELECT time from action_table_g', function(err, rows) {
        if(err) throw err;

        console.log('The solution is: ', rows);
        res.send(rows);
    });
});

app.get('/action/duration', function(req, res){
    connection.query('SELECT duration from action_table_g', function(err, rows) {
        if(err) throw err;

        console.log('The solution is: ', rows);
        res.send(rows);
    });
});

app.listen(app.get('port'), function () {
    console.log('Express server listening on port ' + app.get('port'));
});

// connection.query('select * from sooyeon', (err, rows, fields) => {
//     if (!err)
//         console.log('The solution is: ', rows);
//     else
//         console.log('Error while performing Query.', err);
// });
//
// connection.end();