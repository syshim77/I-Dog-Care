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

var curActivity = 0;
var curSleep = 0;
var curJoint = 0;
var curEat = 0;
var curTemp = 0;
var curHrv = 0;

// home dashboard api
app.get('/', cors(), (req, res) => {
  connection.query('SELECT time, stat1, stat2, stat3, stat4 from act_temp_table', function(err, rows) {
    if (err) throw err;

    var activityFive = [];
    var activityPer30 = new Array(48);
    var cnt=0;

    var date = new Date(rows[0].time);
    var check = 1;

    for (var i=0; i<rows.length; i+=6) {
      activityPer30[cnt] = 0;
      for (var j=0; j<6; j++) {
        if (i+j >= rows.length) {
          check = 0;
          break;
        }

        if (date.getDate() === new Date(rows[i+j].time).getDate()) {
          activityPer30[cnt] += (rows[i+j].stat1 + rows[i+j].stat2 + rows[i+j].stat3 + rows[i+j].stat4)/120;
        } else {
          date = new Date(rows[i+j].time);
          activityFive.push(activityPer30);
          activityPer30 = new Array(48);
          cnt = 0;
          break;
        }
      }
      cnt++;

      if (check === 0) {
        activityFive.push(activityPer30);
        break;
      }
    }

    activityPer30 = activityFive[0];
    console.log(activityPer30);
    var len = activityFive[0].length;
    for (var i=0; i<len; i++) {
      curActivity += activityPer30[i];
    }
    curActivity /= 60;
  });

  connection.query('SELECT sleep from sleep_table_h', function(err, rows) {
    if (err) throw err;

    var sleep = [];
    var sleep48 = new Array(48);
    var cnt = 0;

    for (var i = 0; i < rows.length; i += 6) {
      sleep48[cnt] = 0;

      for (var j = 0; j < 6; j++) {
        sleep48[cnt] += rows[i + j].sleep;
      }
      cnt++;

      if (cnt === 48) {
        sleep.push(sleep48);
        sleep48 = new Array(48);
        cnt = 0;
      }
    }

    sleep48 = sleep[sleep.length - 1];
    var len = sleep[sleep.length - 1].length;
    for (var i = 0; i < len; i++) {
      curSleep += sleep48[i];
    }
    curSleep /= 60;
  });

  var curData = [];
  setTimeout(function() {
    curData = [Math.ceil(curActivity), Math.ceil(curSleep), curJoint, curEat, curTemp, curHrv];
  }, 100);

  setTimeout(function() {
    res.send(JSON.stringify(curData));
  }, 100);
});


// activity day chart api
app.get('/activity/day', cors(), (req, res) => {
  var activity = [];

  connection.query('SELECT time, stat1, stat2, stat3, stat4 from act_temp_table', function(err, rows) {
    if (err) throw err;

    var activityDay = [];
    var playDay = [];
    var cnt = 0;

    var date = new Date(rows[0].time);
    activityDay[0] = 0;
    playDay[0] = 0;

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() === new Date(rows[i].time).getDate()) {
        activityDay[cnt] += (rows[i].stat1 + rows[i].stat2 + rows[i].stat3 + rows[i].stat4)/120;
        playDay[cnt] += rows[i].stat3/120;
      } else {
        cnt++;
        date = new Date(rows[i].time);
        activityDay[cnt] = (rows[i].stat1 + rows[i].stat2 + rows[i].stat3 + rows[i].stat4)/120;
        playDay[cnt] = rows[i].stat3/120;
      }
    }

    activityDay.reverse();
    playDay.reverse();

    activity.push(activityDay);
    activity.push(playDay);
  });

  connection.query('SELECT time, DAYOFWEEK(time) AS week_n, CASE DAYOFWEEK(time)' +
      'WHEN \'1\' THEN \'일\' WHEN \'2\' THEN \'월\' WHEN \'3\' THEN \'화\' WHEN \'4\' THEN \'수\'\n' +
      'WHEN \'5\' THEN \'목\' WHEN \'6\' THEN \'금\' WHEN \'7\' THEN \'토\' END AS week from act_temp_table', function(err, rows) {
    if (err) throw err;

    var weekDay = [];
    var cnt = 0;

    var date = new Date(rows[0].time);
    weekDay[cnt] = rows[0].week;

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() !== new Date(rows[i].time).getDate()) {
        cnt++;
        date = new Date(rows[i].time);
        weekDay[cnt] = rows[i].week;
      }
    }

    weekDay.reverse();
    activity.push(weekDay);
  });

  setTimeout(function() {
    res.send(JSON.stringify(activity));
  }, 100);
});

// activity list chart time part api
app.get('/activity/list', cors(), (req, res) => {
  connection.query('SELECT stat1, stat2, stat3, stat4, time, DAYOFWEEK(time) AS week_n, CASE DAYOFWEEK(time)' +
      'WHEN \'1\' THEN \'일\' WHEN \'2\' THEN \'월\' WHEN \'3\' THEN \'화\' WHEN \'4\' THEN \'수\'\n' +
      'WHEN \'5\' THEN \'목\' WHEN \'6\' THEN \'금\' WHEN \'7\' THEN \'토\' END AS week from act_temp_table', function(err, rows) {
    if (err) throw err;

    var activityList = [];
    var activityPerList = [];
    var sum = 0;

    var date = new Date(rows[0].time);
    var str = String(date.getMonth() + 1) + '월 ' + String(date.getDate()) + '일 (' + rows[0].week + ')';
    activityPerList.push(str);
    var check = 1;

    for (var i = 0; i < rows.length; i += 6) {
      for (var j = 0; j < 6; j++) {
        if (i + j >= rows.length) {
          check = 0;
          break;
        }

        if (date.getDate() === new Date(rows[i + j].time).getDate()) {
          sum += (rows[i + j].stat1 + rows[i + j].stat2 + rows[i + j].stat3 + rows[i + j].stat4) / 120;
        } else {
          activityPerList.push(Math.round(sum/60));
          activityList.push(activityPerList);

          date = new Date(rows[i + j].time);
          activityPerList = [];
          str = String(date.getMonth() + 1) + '월 ' + String(date.getDate()) + '일 (' + rows[i+j].week + ')';
          activityPerList.push(str);
          sum = 0;
        }

        if (check === 0) {
          activityPerList.push(Math.round(sum/60));
          activityList.push(activityPerList);
          break;
        }
      }
    }

    res.send(JSON.stringify(activityList));
  })
});

// activity list chart api
app.get('/activity/five', cors(), (req, res) => {
  connection.query('SELECT time, stat1, stat2, stat3, stat4 from act_temp_table', function(err, rows) {
    if (err) throw err;

    var activityFive = [];
    var activityPer30 = new Array(48);
    var cnt=0;

    var date = new Date(rows[0].time);
    var check = 1;

    for (var i=0; i<rows.length; i+=6) {
      activityPer30[cnt] = 0;
      for (var j=0; j<6; j++) {
        if (i+j >= rows.length) {
          check = 0;
          break;
        }

        if (date.getDate() === new Date(rows[i+j].time).getDate()) {
          activityPer30[cnt] += (rows[i+j].stat1 + rows[i+j].stat2 + rows[i+j].stat3 + rows[i+j].stat4)/120;
        } else {
          date = new Date(rows[i+j].time);
          activityFive.push(activityPer30);
          activityPer30 = new Array(48);
          cnt = 0;
          break;
        }
    }
      cnt++;

      if (check === 0) {
        activityFive.push(activityPer30);
        break;
      }
    }

    res.send(JSON.stringify(activityFive));
  });
});


app.get('/sleep/day', cors(), (req, res) => {
  connection.query('SELECT sleep from sleep_table_h', function(err, rows) {
    if (err) throw err;

    var sleepDay = new Array(rows.length/288);
    var cnt = 0;

    for (var i=0; i<rows.length; i+=288) {
      sleepDay[cnt] = 0;
      for (var j=0; j<288; j++) {
        sleepDay[cnt] += rows[i+j].sleep;
      }
      cnt++;
    }

    res.send(JSON.stringify(sleepDay));
  })
});

app.get('/sleep/five', cors(), (req, res) => {
  connection.query('SELECT sleep from sleep_table_h', function(err, rows) {
    if (err) throw err;

    var sleep = [];
    var sleep48 = new Array(48);
    var cnt = 0;

    for (var i=0; i<rows.length; i+=6) {
      sleep48[cnt]=0;

      for (var j=0; j<6; j++) {
        sleep48[cnt] += rows[i+j].sleep;
      }
      cnt++;

      if (cnt === 48) {
        sleep.push(sleep48);
        // console.log(action48);
        // console.log(action);
        // console.log('\n');

        sleep48 = new Array(48);
        cnt=0;
      }
      // console.log(action);
    }

    sleep48 = sleep[sleep.length-1];
    var len = sleep[sleep.length-1].length;
    for (var i=0; i<len; i++) {
      curSleep += sleep48[i];
    }
    curSleep /= 60;

    // console.log(action);
    res.send(JSON.stringify(sleep));
  })
});

app.get('/temperature/day', cors(), (req, res) => {
  var temperature = [];

  connection.query('SELECT time, avg_temp, max_temp from act_temp_table', function(err, rows) {
    if(err) throw err;

    // var temperature = [];
    // var average = new Array(Math.ceil(rows.length/288));
    // var max = new Array(Math.ceil(rows.length/288));
    var avgTemp = [];
    var maxTemp = [];
    var cnt = 0;

    var date = new Date(rows[0].time);

    // for (var i=0; i<rows.length; i+=288) {
      // var row1 = rows[i];
      // var row2 = rows[i+1];
      // var row3 = rows[i+2];
      // duration.push(row.duration);

      // average[cnt] = (rows[i].average + rows[i+1].average + rows[i+2].average)/3;
      // max[cnt] = (rows[i].max + rows[i+1].max + rows[i+2].max)/3;
      // cnt++;
      average[cnt]=0; max[cnt]=0;
      for (var j=0; j<288; j++) {
        // average[cnt] += rows[i+j].average;
        // max[cnt] += rows[i+j].max;
        average[cnt] += rows[i+j].avg_temp;
        max[cnt] = Math.max(max[cnt], rows[i+j].max_temp);
        // max[cnt] = Math.max(max[cnt], rows[i+j].max); // 10분 단위 최대값 중 최대값
      }

      average[cnt] /= 288;
      // max[cnt] /= 144;  // 최대값들의 평균값
      cnt++;
      // console.log('The solution is average[', i, ']: ', average[i], ', max[', i, ']: ', max[i], '\n');
    }

    temperature.push(max, average);

    // res.send(rows);
  });

  connection.query('SELECT time, DAYOFWEEK(time) AS week_n, CASE DAYOFWEEK(time)' +
      'WHEN \'1\' THEN \'일\' WHEN \'2\' THEN \'월\' WHEN \'3\' THEN \'화\' WHEN \'4\' THEN \'수\'\n' +
      'WHEN \'5\' THEN \'목\' WHEN \'6\' THEN \'금\' WHEN \'7\' THEN \'토\' END AS week from act_temp_table', function(err, rows) {
    if(err) throw err;

    var temperature = [];
    // var average = new Array(Math.ceil(rows.length/288));
    // var max = new Array(Math.ceil(rows.length/288));
    var cnt = 0;
    //
    for (var i=0; i<rows.length; i+=288) {
      // var row1 = rows[i];
      // var row2 = rows[i+1];
      // var row3 = rows[i+2];
      // duration.push(row.duration);

      // average[cnt] = (rows[i].average + rows[i+1].average + rows[i+2].average)/3;
      // max[cnt] = (rows[i].max + rows[i+1].max + rows[i+2].max)/3;
      // cnt++;
      average[cnt]=0; max[cnt]=0;
      for (var j=0; j<288; j++) {
        // average[cnt] += rows[i+j].average;
        // max[cnt] += rows[i+j].max;
        average[cnt] += rows[i+j].avg_temp;
        max[cnt] = Math.max(max[cnt], rows[i+j].max_temp);
        // max[cnt] = Math.max(max[cnt], rows[i+j].max); // 10분 단위 최대값 중 최대값
      }

      average[cnt] /= 288;
      // max[cnt] /= 144;  // 최대값들의 평균값
      cnt++;
      // console.log('The solution is average[', i, ']: ', average[i], ', max[', i, ']: ', max[i], '\n');
    }

    temperature.push(max, average);

    // res.send(rows);
  });

  res.send(JSON.stringify(temperature));
});

app.get('/temperature/five', cors(), (req, res) => {
  connection.query('SELECT average, max from temp_table_g', function(err, rows) {
    if(err) throw err;

    // console.log('The solution is: ', rows);
    var temperature = [];
    var average = new Array(rows.length/3);
    var max = new Array(rows.length/3);
    var cnt = 0;
    //
    for (var i=0; i<rows.length; i+=3) {
      // var row1 = rows[i];
      // var row2 = rows[i+1];
      // var row3 = rows[i+2];
      // duration.push(row.duration);
      average[cnt] = (rows[i].average + rows[i+1].average + rows[i+2].average)/3;
      max[cnt] = (rows[i].max + rows[i+1].max + rows[i+2].max)/3;
      cnt++;
      // console.log('The solution is average[', i, ']: ', average[i], ', max[', i, ']: ', max[i], '\n');
    }

    temperature.push(average, max);

    // res.send(rows);
    res.send(JSON.stringify(temperature));
  });
});

app.get('/hrv/day', cors(), (req, res) => {
  connection.query('SELECT average, max from heart_table_g', function(err, rows) {
    if(err) throw err;

    // console.log('The solution is: ', rows);
    var hrv = [];
    var average = new Array(rows.length/144);
    var max = new Array(rows.length/144);
    var cnt = 0;
    //
    for (var i=0; i<rows.length; i+=144) {
      average[cnt]=0; max[cnt]=0;
      for (var j=0; j<144; j++) {
        average[cnt] += rows[i+j].average;
        max[cnt] += rows[i+j].max;
      }

      average[cnt] /= 144;
      max[cnt] /= 144;
      cnt++;
    }

    hrv.push(max, average);

    // res.send(rows);
    res.send(JSON.stringify(hrv));
  });
});

app.get('/hrv/five', cors(), (req, res) => {
  connection.query('SELECT average, max from heart_table_g', function(err, rows) {
    if(err) throw err;

    // console.log('The solution is: ', rows);
    var hrv = [];
    var average = new Array(rows.length/144);
    var max = new Array(rows.length/144);
    var cnt = 0;
    //
    for (var i=0; i<rows.length; i+=144) {
      average[cnt]=0; max[cnt]=0;
      for (var j=0; j<144; j++) {
        average[cnt] += rows[i+j].average;
        max[cnt] += rows[i+j].max;
      }

      average[cnt] /= 144;
      max[cnt] /= 144;
      cnt++;
    }

    hrv.push(max, average);

    // res.send(rows);
    res.send(JSON.stringify(hrv));
  });
});


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

module.exports = app;