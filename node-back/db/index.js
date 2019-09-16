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

app.get('/sooyeon', function(req, res){
    connection.query('SELECT * from sooyeon', function(err, rows) {
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