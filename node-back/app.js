/*var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// const axios = require('axios');
//
// async function makeRequest() {
//
//   const config = {
//     method: 'get',
//     url: '/user',
//     name: 'syshim77'
//   };
//
//   let res = await axios(config);
//
//   console.log(res.status);
// }
// makeRequest();

module.exports = app;
*/

var createError = require('http-errors');
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var mysql = require('mysql');
var config = require('./db/config/config');
var connection = mysql.createConnection(config);

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', cors(), (req, res) => {
  // var totalData = {id: 1, name: 'total', value: '735'};
  var dataList = [
    {id: 1, name: 'total', value: '735'},
    {id: 2, name: 'activity', value: '5.5h'},
    {id: 3, name: 'sleep', value: '18.5h'},
    {id: 4, name: 'joint', value: '위험'},
    {id: 5, name: 'stress', value: '주의'},
    {id: 6, name: 'calorie', value: '560kcal'},
    {id: 7, name: 'temperature', value: '37℃'},
    {id: 8, name: 'hrv', value: '140bpm'}
  ];

  // res.send(JSON.stringify(totalData));
  res.send(JSON.stringify(dataList));
});

app.get('/activity', cors(), (req, res) => {
  connection.query('SELECT duration from action_table_g', function(err, rows) {
    if(err) throw err;

    // console.log('The solution is: ', rows);
    var duration = new Array(rows.length/3);
    var cnt = 0;
    //
    for (var i=0; i<rows.length; i+=3) {
      var row1 = rows[i];
      var row2 = rows[i+1];
      var row3 = rows[i+2];
      // duration.push(row.duration);
      duration[cnt] = row1.duration + row2.duration + row3.duration;
      cnt++;
      console.log('The solution is duration[', i, ']: ', duration[i], '\n');
    }

    // res.send(rows);
    res.send(JSON.stringify(duration));
  });
});

app.get('/sleep', cors(), (req, res) => {
  connection.query('SELECT duration from sleep_table_g', function(err, rows) {
    if(err) throw err;

    // console.log('The solution is: ', rows);
    var duration = new Array(rows.length/3);
    var cnt = 0;
    //
    for (var i=0; i<rows.length; i+=3) {
      var row1 = rows[i];
      var row2 = rows[i+1];
      var row3 = rows[i+2];
      // duration.push(row.duration);
      duration[cnt] = row1.duration + row2.duration + row3.duration;
      cnt++;
      console.log('The solution is duration[', i, ']: ', duration[i], '\n');
    }

    // res.send(rows);
    res.send(JSON.stringify(duration));
  });
});

app.get('/joint', cors(), (req, res) => {
  connection.query('SELECT duration from sleep_table_g', function(err, rows) {
    if(err) throw err;

    // console.log('The solution is: ', rows);
    var duration = new Array(rows.length/3);
    var cnt = 0;
    //
    for (var i=0; i<rows.length; i+=3) {
      var row1 = rows[i];
      var row2 = rows[i+1];
      var row3 = rows[i+2];
      // duration.push(row.duration);
      duration[cnt] = row1.duration + row2.duration + row3.duration;
      cnt++;
      console.log('The solution is duration[', i, ']: ', duration[i], '\n');
    }

    // res.send(rows);
    res.send(JSON.stringify(duration));
  });
});

app.get('/stress', cors(), (req, res) => {
  connection.query('SELECT duration from sleep_table_g', function(err, rows) {
    if(err) throw err;

    // console.log('The solution is: ', rows);
    var duration = new Array(rows.length/3);
    var cnt = 0;
    //
    for (var i=0; i<rows.length; i+=3) {
      var row1 = rows[i];
      var row2 = rows[i+1];
      var row3 = rows[i+2];
      // duration.push(row.duration);
      duration[cnt] = row1.duration + row2.duration + row3.duration;
      cnt++;
      console.log('The solution is duration[', i, ']: ', duration[i], '\n');
    }

    // res.send(rows);
    res.send(JSON.stringify(duration));
  });
});

app.get('/calorie', cors(), (req, res) => {
  connection.query('SELECT duration from sleep_table_g', function(err, rows) {
    if(err) throw err;

    // console.log('The solution is: ', rows);
    var duration = new Array(rows.length/3);
    var cnt = 0;
    //
    for (var i=0; i<rows.length; i+=3) {
      var row1 = rows[i];
      var row2 = rows[i+1];
      var row3 = rows[i+2];
      // duration.push(row.duration);
      duration[cnt] = row1.duration + row2.duration + row3.duration;
      cnt++;
      console.log('The solution is duration[', i, ']: ', duration[i], '\n');
    }

    // res.send(rows);
    res.send(JSON.stringify(duration));
  });
});

app.get('/temperature', cors(), (req, res) => {
  connection.query('SELECT duration from sleep_table_g', function(err, rows) {
    if(err) throw err;

    // console.log('The solution is: ', rows);
    var duration = new Array(rows.length/3);
    var cnt = 0;
    //
    for (var i=0; i<rows.length; i+=3) {
      var row1 = rows[i];
      var row2 = rows[i+1];
      var row3 = rows[i+2];
      // duration.push(row.duration);
      duration[cnt] = row1.duration + row2.duration + row3.duration;
      cnt++;
      console.log('The solution is duration[', i, ']: ', duration[i], '\n');
    }

    // res.send(rows);
    res.send(JSON.stringify(duration));
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

app.get('/hrv', cors(), (req, res) => {
  connection.query('SELECT duration from sleep_table_g', function(err, rows) {
    if(err) throw err;

    // console.log('The solution is: ', rows);
    var duration = new Array(rows.length/3);
    var cnt = 0;
    //
    for (var i=0; i<rows.length; i+=3) {
      var row1 = rows[i];
      var row2 = rows[i+1];
      var row3 = rows[i+2];
      // duration.push(row.duration);
      duration[cnt] = row1.duration + row2.duration + row3.duration;
      cnt++;
      console.log('The solution is duration[', i, ']: ', duration[i], '\n');
    }

    // res.send(rows);
    res.send(JSON.stringify(duration));
  });
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
/*
// router 굉장히 중요한 부분
// 이 코드는 무조건 숙지해야함
var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');  // 미들웨어
var app = express();
app.locals.pretty = true;

app.set('view engine', 'pug');
app.set('views', './views');  // 이 코드를 생략해도 자동으로 찾도록 설계되어있음
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));
// app.use(cors());
app.get('/form', function(req, res) { // 익명 함수
  res.render('form');
});
// get 방식
app.get('/form_receiver', cors(), function(req, res) {
  //res.send('Hello, GET');
  // var title = req.query.title;
  var title = '1';
  // var description = req.query.description;
  var description = '2';
  var obj = {title : title, description: description};

  var list = [
    { date: '12/1/2011', reading: 3, id: 20055 },
    { date: '13/1/2011', reading: 5, id: 20053 },
    { date: '14/1/2011', reading: 6, id: 45652 }
  ];


  res.send(JSON.stringify(list));
});
// post 방식, url에 정보가 드러나지 않음
// app.post('/form_receiver', function(req, res) {
//   //res.send('Hello, POST');
//   var title = req.body.title;
//   var description = req.body.description;
//   res.send(title+','+description);
// });
// query string
app.get('/topic', function(req, res) {
  var topics = [
    'JavaScript is...',
    'Nodejs is...',
    'Express is...'
  ];
  var output = `
    <a href="/topic?id=0">JavaScript</a><br>
    <a href="/topic?id=1">Nodejs</a><br>
    <a href="/topic?id=2">Express</a><br><br>
    ${topics[req.query.id]}
  `;
  //res.send(req.query.id+','+req.query.name);  // topic?id=1&name-egoing -> 1,egoing
  //res.send(topics[req.query.id]);
  res.send(output);
});
// sementic URL
app.get('/topic/:id', function(req, res) {
  var topics = [
    'JavaScript is...',
    'Nodejs is...',
    'Express is...'
  ];
  var output = `
    <a href="/topic/0">JavaScript</a><br>
    <a href="/topic/1">Nodejs</a><br>
    <a href="/topic/2">Express</a><br><br>
    ${topics[req.params.id]}
  `;
  //res.send(req.query.id+','+req.query.name);  // topic?id=1&name-egoing -> 1,egoing
  //res.send(topics[req.query.id]);
  res.send(output);
});
app.get('/topic/:id/:mode', function(req, res) {
  res.send(req.params.id+','+req.params.mode);
})
app.get('/template', function(req, res) {
  res.render('temp', {time:Date(), _title:'Pug'});
});
app.get('/', function(req, res) { // url을 쳐서 들어오는 방식이 GET 방식, get: router, get이 하는 일: routing
  res.send('Hello home page');
});
// static: 새로고침하면 실시간으로 변경사항 반영됨, dynamic: 아예 종료했다가 다시 시작해야함
app.get('/dynamic', function(req, res) {
  var lis = '';
  for (var i=0; i<5; i++) {
    lis = lis+'<li>coding</li>';
  }
  var time = Date();
  var output = `<!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <title></title>
    </head>
    <body>
      Hello, Dynamic!
      <ul>
        ${lis}
      </ul>
      ${time}
    </body>
  </html>`;
  res.send(output);
});
app.get('/route', function(req, res) {
  res.send('Hello Router, <img src="/route.png">');
});
app.get('/login', function(req, res) {
  res.send('<h1>Login please</h1>');
});
app.listen(3000, function() {
  console.log('Connected 3000 port!');
});

// 사용자 -> router -> controller
// 사용자 -> get.('/') -> send('Welcome to homepage')
// 사용자 -> get.('/login') -> send('login please')

*/