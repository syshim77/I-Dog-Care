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

var curActivity = 0;
var curSleep = 0;
var curJoint = 0;
var curEat = 0;
var curTemp = 0;
var curHrv = 0;


// app.get('/', cors(), (req, res) => {
//   // var totalData = {id: 1, name: 'total', value: '735'};
//   var dataList = [
//     {id: 1, name: 'total', value: '735'},
//     {id: 2, name: 'activity', value: '5.5h'},
//     {id: 3, name: 'sleep', value: '18.5h'},
//     {id: 4, name: 'joint', value: '위험'},
//     {id: 5, name: 'stress', value: '주의'},
//     {id: 6, name: 'calorie', value: '560kcal'},
//     {id: 7, name: 'temperature', value: '37℃'},
//     {id: 8, name: 'hrv', value: '140bpm'}
//   ];
//
//   // res.send(JSON.stringify(totalData));
//   res.send(JSON.stringify(dataList));
// });

// app.get('/home', cors(), (req, res) => {
//   var curData = [curActivity, curSleep, curJoint, curEat, curTemp, curHrv];
//
//   res.send(JSON.stringify(curData));
// });

app.get('/time', (req, res) => {
    connection.query('SELECT time from action_table_g', function(err, rows) {
        if (err) throw err;

        console.log('The solution is: ', rows, '\n');

        res.send(rows);
    });
});

app.get('/table/time', cors(), (req, res) => {
    connection.query('SELECT time from act_temp_table', function(err, rows) {
        console.log('The solution is: ', rows, '\n');
        console.log('The length: ', rows.length);

        if (err) throw err;

        console.log('The solution time is ', rows.time, '\n');
        var timeStamp = new Array(Math.ceil(rows.length/288));
        var cnt = 0;

        var check = 1;
        for (var i=0; i<rows.length; i+=288) {
            for (var j=0; j<288; j++) {
                if (i+j >= rows.length) {
                    check = 0;
                    break;
                }
                console.log('The row: ', rows[i+j]);
                console.log('The time: ', rows[i+j].time);

                var date = new Date(rows[i+j].time);
                console.log(date.getMonth()+1, ' ', date.getDate());
                timeStamp[cnt] = rows[i+j].time;
            }
            cnt++;

            if (check === 0) {
                break;
            }
        }

        // res.send(rows);
        res.send(JSON.stringify(timeStamp));

        // res.send(rows);
    })
});

app.get('/day', (req, res) => {
    connection.query('SELECT duration from action_table_g', function(err, rows) {
        if (err) throw err;

        var durationPerDay = new Array(rows.length/144);
        var cnt=0;

        for (var i=0; i<rows.length; i+=144) {
            durationPerDay[cnt] = 0;
            for (var j=0;j<144; j++) {
                var row = rows[i+j];
                durationPerDay[cnt] += row.duration
            }
            cnt++;
        }

        res.send(JSON.stringify(durationPerDay));
    });
});

app.get('/activity/day', (req, res) => {
    connection.query('SELECT action, outside from action_table_h', function(err, rows) {
        // var actionOutside = [];
        var actionDay = new Array(Math.ceil(rows.length/288));
        // var actionDay = new Array(rows.length/288);
        // var outsideDay = new Array(rows.length/288);
        var cnt=0;

        var check = 1;
        for (var i=0; i<rows.length; i+=288) {
            actionDay[cnt] = 0;
            // outsideDay[cnt] = 0;
            for (var j=0;j<288; j++) {
                // var row = rows[i+j];
                // actionDay[cnt] += row.duration
                // actionDay[cnt] += rows[i+j].action;
                // outsideDay[cnt] += rows[i+j].outside;
                if (i+j >= rows.length) {
                    check = 0;
                    break;
                }
                actionDay[cnt] += rows[i+j].stat1 + rows[i+j].stat2 + rows[i+j].stat3 + rows[i+j].stat4;
            }
            actionDay[cnt] /= 2;
            cnt++;

            if (check === 0) {
                break;
            }
        }

        // actionOutside.push(actionDay, outsideDay);

        // res.send(JSON.stringify(actionOutside));
        // res.send(JSON.stringify(actionDay));
    })
});

app.get('/activity', cors(), (req, res) => {
    // connection.query('SELECT action, outside from action_table_h', function(err, rows) {
    connection.query('SELECT time, stat1, stat2, stat3, stat4 from act_temp_table', function(err, rows) {
        // console.log('The rows: ', rows, '\n');
        // console.log('The length: ', rows.length);
        // console.log('The time: ', rows.time);
        // console.log('The stat1: ', rows.stat1);
        // console.log('The stat2: ', rows.stat2);
        // console.log('The stat3: ', rows.stat3);
        // console.log('The stat4: ', rows.stat4);

        if (err) throw err;

        var activity = [];
        var activityDay = [];
        var weekDay = [];
        var cnt = 0;

        var date = new Date(rows[0].time);
        activityDay[0] = 0;
        // console.log('The date1: ', date);
        // weekDay[0] = rows[0].week;
        for (var i=0; i<rows.length; i++) {
            if (date.getDate() === new Date(rows[i].time).getDate()) {
                // console.log('The date2: ', date);
                activityDay[cnt] += (rows[i].stat1 + rows[i].stat2 + rows[i].stat3 + rows[i].stat4)/120;
                console.log('activityDay: ', activityDay[cnt]);
                // console.log('The stat1: ', rows[i].stat1);
                // console.log('The stat2: ', rows[i].stat2);
                // console.log('The stat3: ', rows[i].stat3);
                // console.log('The stat4: ', rows[i].stat4);
            } else {
                // console.log('The date3: ', date);
                // cnt++;
                // activityDay[cnt] /= 120;
                // weekDay[cnt] = rows[i].week;
                cnt++;
                date = new Date(rows[i].time);
                activityDay[cnt] = 0;
            }
        }

        console.log('activityDay: ', activityDay);
        // activity.push(activityDay, weekDay);

        // res.send(JSON.stringify(activity));
        res.send(JSON.stringify(activityDay));
    });
});

app.get('/activity/list', cors(), (req, res) => {
    connection.query('SELECT action from action_table_h', function(err, rows) {
        if (err) throw err;

        var actionList = [];
        // const action = [];
        // var action48 = new Array(48);
        var actionPerList = 0;
        var cnt=0;

        // for (var i=0; i<rows.length; i++) {
        //   console.log('The solution is: ', rows[i], '\n');
        // }


        for (var i=0; i<rows.length; i+=6) {
            // action48[cnt]=0;

            for (var j=0; j<6; j++) {
                // action48[cnt] += rows[i+j].action;
                actionPerList += rows[i+j].action;
            }
            cnt++;

            if (cnt === 48) {
                // action.push(action48);
                // console.log(action48);
                // console.log(action);
                // console.log('\n');

                // action48 = new Array(48);
                // cnt=0;

                actionList.push(Math.ceil(actionPerList/60));
                actionPerList = 0;
                cnt=0;
            }
            // console.log(action);
        }

        // action48 = action[action.length-1];
        // var len = action[action.length-1].length;
        // for (var i=0; i<len; i++) {
        //   curActivity += action48[i];
        // }
        // curActivity /= 60;

        res.send(JSON.stringify(actionList));
    });
});

app.get('/activity/five', cors(), (req, res) => {
    // connection.query('SELECT action from action_table_h', function(err, rows) {
    connection.query('SELECT stat1, stat2, stat3, stat4 from act_temp_table', function(err, rows) {
        if (err) throw err;

        // console.log('The solution is: ', rows, '\n');

        // var action = new Array(rows.length/6);
        // var action48 = new Array(48);
        // var action24 = new Array(24);

        // var action = new Array();
        var action = [];
        // const action = [];
        var action48 = new Array(48);
        var cnt=0;

        // for (var i=0; i<rows.length; i++) {
        //   console.log('The solution is: ', rows[i], '\n');
        // }

        var check = 1;
        for (var i=0; i<rows.length; i+=6) {
            action48[cnt]=0;

            for (var j=0; j<6; j++) {
                if (i+j >= rows.length) {
                    check = 0;
                    break;
                }
                // action48[cnt] += rows[i+j].action;
                action48[cnt] += rows[i+j].stat1 + rows[i+j].stat2 + rows[i+j].stat3 + rows[i+j].stat4;
            }
            action48[cnt] /= 2;
            cnt++;

            if (cnt === 48) {
                action.push(action48);
                // console.log(action48);
                // console.log(action);
                // console.log('\n');

                action48 = new Array(48);
                cnt=0;
            }

            if (check === 0) {
                action.push(action48);
                break;
            }
            // console.log(action);
        }

        action48 = action[action.length-1];
        var len = action[action.length-1].length;
        for (var i=0; i<len; i++) {
            curActivity += action48[i];
        }
        curActivity /= 60;
        // curActivity.toFixed(0);

        // console.log(action);
        res.send(JSON.stringify(action));
        // res.send(JSON.stringify(action48));
        // res.send(JSON.stringify(action24));
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


// 산책 시간에 대한 table 추가되어야함
// app.get('/activity', cors(), (req, res) => {
//   connection.query('SELECT duration from action_table_g', function(err, rows) {
//     if(err) throw err;
//
//     console.log('The solution is: ', rows, '\n');
//     var duration = new Array(rows.length/3);
//     var cnt = 0;
//     //
//     for (var i=0; i<rows.length; i+=3) {
//       var row1 = rows[i];
//       var row2 = rows[i+1];
//       var row3 = rows[i+2];
//       // duration.push(row.duration);
//       duration[cnt] = row1.duration + row2.duration + row3.duration;
//       cnt++;
//       console.log('The solution is duration[', cnt, ']: ', duration[cnt], '\n');
//     }
//
//     // res.send(rows);
//     res.send(JSON.stringify(duration));
//   });
// });

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
    connection.query('SELECT level from joint_table_g', function(err, rows) {
        if(err) throw err;

        // console.log('The solution is: ', rows);
        var level = new Array(rows.length/3);
        var cnt = 0;
        //
        for (var i=0; i<rows.length; i+=3) {
            var row1 = rows[i];
            var row2 = rows[i+1];
            var row3 = rows[i+2];
            // duration.push(row.duration);
            level[cnt] = (row1.level + row2.level + row3.level)/3;
            cnt++;
            console.log('The solution is level[', i, ']: ', level[i], '\n');
        }

        // res.send(rows);
        res.send(JSON.stringify(level));
    });
});

app.get('/stress', cors(), (req, res) => {
    connection.query('SELECT level from stress_table_g', function(err, rows) {
        if(err) throw err;

        // console.log('The solution is: ', rows);
        var level = new Array(rows.length/3);
        var cnt = 0;
        //
        for (var i=0; i<rows.length; i+=3) {
            var row1 = rows[i];
            var row2 = rows[i+1];
            var row3 = rows[i+2];
            // duration.push(row.duration);
            level[cnt] = (row1.level + row2.level + row3.level)/3;
            cnt++;
            console.log('The solution is level[', i, ']: ', level[i], '\n');
        }

        // res.send(rows);
        res.send(JSON.stringify(level));
    });
});

// 식사량에 대한 table 추가되어야함
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

// average, max 두 개 어떻게 JSON으로 보낼건지 고민
app.get('/temperature/day', cors(), (req, res) => {
    // connection.query('SELECT average, max from temp_table_g', function(err, rows) {
    connection.query('SELECT avg_temp, max_temp from act_temp_table', function(err, rows) {
        console.log('The solution: ', rows, '\n');
        console.log('The length: ', rows.length);
        if(err) throw err;

        // console.log('The solution is: ', rows);
        var temperature = [];
        // var average = new Array(rows.length/144);
        // var max = new Array(rows.length/144);
        var average = new Array(Math.ceil(rows.length/288));
        var max = new Array(Math.ceil(rows.length/288));
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
        res.send(JSON.stringify(temperature));
    });
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

// average, max 두 개 어떻게 JSON으로 보낼건지 고민
app.get('/hrv', cors(), (req, res) => {
    connection.query('SELECT average, max from heart_table_g', function(err, rows) {
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

app.get('/', cors(), (req, res) => {
    // curActivity.toFixed(0);
    // Math.ceil(curActivity);

    connection.query('SELECT action from action_table_h', function(err, rows) {
        if (err) throw err;

        // console.log('The solution is: ', rows, '\n');

        // var action = new Array(rows.length/6);
        // var action48 = new Array(48);
        // var action24 = new Array(24);

        // var action = new Array();
        var action = [];
        // const action = [];
        var action48 = new Array(48);
        var cnt = 0;

        // for (var i=0; i<rows.length; i++) {
        //   console.log('The solution is: ', rows[i], '\n');
        // }


        for (var i = 0; i < rows.length; i += 6) {
            action48[cnt] = 0;

            for (var j = 0; j < 6; j++) {
                action48[cnt] += rows[i + j].action;
            }
            cnt++;

            if (cnt === 48) {
                action.push(action48);
                // console.log(action48);
                // console.log(action);
                // console.log('\n');

                action48 = new Array(48);
                cnt = 0;
            }
            // console.log(action);
        }

        action48 = action[action.length - 1];
        var len = action[action.length - 1].length;
        for (var i = 0; i < len; i++) {
            curActivity += action48[i];
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
                // console.log(action48);
                // console.log(action);
                // console.log('\n');

                sleep48 = new Array(48);
                cnt = 0;
            }
            // console.log(action);
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
    // var curData = [Math.ceil(curActivity), Math.ceil(curSleep), curJoint, curEat, curTemp, curHrv];

    setTimeout(function() {
        res.send(JSON.stringify(curData));
    }, 100);
    // res.send(JSON.stringify(curData));
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