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
app.get('/', (req, res) => {
  connection.query('SELECT time, stat1, stat2, stat3, stat4 from act_temp_table where test_number=999 ORDER BY time asc', function(err, rows) {
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
          activityPer30[cnt] = (rows[i+j].stat1 + rows[i+j].stat2 + rows[i+j].stat3 + rows[i+j].stat4)/120;
        }
      }
      cnt++;

      if (check === 0) {
        break;
      }
    }
    activityFive.push(activityPer30);
    activityFive.reverse();

    activityPer30 = activityFive[0];
    var len = activityFive[0].length;
    for (var i=0; i<len; i++) {
      curActivity += activityPer30[i];
    }
    curActivity /= 60;
  });

  connection.query('SELECT time, stat0 from act_temp_table where test_number=999 ORDER BY time asc', function(err, rows) {
    var sleepList = [];
    var sleepPer30 = new Array(48);
    var cnt = 0;
    var fiveBefore = 0;

    var date = new Date(rows[0].time);
    var check = 1;

    for (var i=0; i<rows.length; i+=6) {
      sleepPer30[cnt] = 0;
      for (var j=0; j<6; j++) {
        if (i+j >= rows.length) {
          check = 0;
          break;
        }

        if (date.getDate() === new Date(rows[i+j].time).getDate()) {
          if (rows[i+j].stat0/120 >= 4) {
            sleepPer30[cnt] += rows[i+j].stat0/120;
            fiveBefore = rows[i+j].stat0/120;
          } else {
            if (fiveBefore >= 4) {
              sleepPer30[cnt] += rows[i+j].stat0/120;
              fiveBefore = rows[i+j].stat0/120;
            } else {
              fiveBefore = rows[i+j].stat0/120;
            }
          }
        } else {
          sleepList.push(sleepPer30);
          sleepPer30 = new Array(48);
          date = new Date(rows[i+j].time);
          cnt = 0;

          if (rows[i+j].stat0/120 >= 4) {
            sleepPer30[cnt] = rows[i+j].stat0/120;
          } else {
            sleepPer30[cnt] = 0;
          }
          fiveBefore = rows[i+j].stat0/120;
        }
      }
      cnt++;

      if (check === 0) {
        break;
      }
    }
    sleepList.push(sleepPer30);
    sleepList.reverse();

    sleepPer30 = sleepList[0];
    var len = sleepList[0].length;
    for (var i = 0; i < len; i++) {
      curSleep += sleepPer30[i];
    }
    curSleep /= 60;
  });

  connection.query('SELECT time, stat3, stat4 from act_temp_table where test_number=999 ORDER BY time asc',  function(err, rows) {
    var jointFive = [];
    var jointPer30 = new Array(48);
    var sumStat3 = 0;
    var sumStat4 = 0;
    var sum = 0;
    var cnt = 0;

    var date = new Date(rows[0].time);
    var check = 1;

    for (var i = 0; i < rows.length; i += 6) {
      jointPer30[cnt] = 0;
      for (var j = 0; j < 6; j++) {
        if (i + j >= rows.length) {
          check = 0;
          break;
        }

        if (date.getDate() === new Date(rows[i + j].time).getDate()) {
          sumStat3 += rows[i + j].stat3;
          sumStat4 += rows[i + j].stat4 * 2;
        } else {
          if (sumStat3 >= 240) {
            sum = sumStat3 + sumStat4;
          } else {
            sum = sumStat4;
          }

          jointPer30[cnt] = sum;

          jointFive.push(jointPer30);
          jointPer30 = new Array(48);

          sumStat3 = rows[i + j].stat3;
          sumStat4 = rows[i + j].stat4 * 2;

          date = new Date(rows[i + j].time);
          cnt = 0;
        }
      }

      if (sumStat3 >= 240) {
        sum = sumStat3 + sumStat4;
      } else {
        sum = sumStat4;
      }

      jointPer30[cnt] = sum;
      sumStat3 = 0;
      sumStat4 = 0;
      cnt++;

      if (check === 0) {
        break;
      }
    }
    jointFive.push(jointPer30);
    jointFive.reverse();

    var danger = 0;
    var warn = 0;
    jointPer30 = jointFive[0];
    var len = jointFive[0].length;
    for (var i = 0; i < len; i++) {
      if (jointPer30[i] >= 720) {
        danger++;
      } else if (jointPer30[i] >= 360) {
        warn++;
      }
    }

    if (danger >= 16) {
      curJoint = '위험';
    } else if(warn >= 16) {
      curJoint = '경고';
    } else {
      curJoint = '양호';
    }
  });

  connection.query('SELECT time, feed from feed_table ORDER BY time asc', function(err, rows) {
    var eatFive = [];
    var day = [];
    var eatPer30 = new Array(48);
    var dayCnt = 0;

    var date = new Date(rows[0].time);
    day[0] = date.getDate();

    for (var i=0; i<rows.length; i++) {
      if (day[dayCnt] !== new Date(rows[i].time).getDate()) {
        dayCnt++;
        date = new Date(rows[i].time);
        day[dayCnt] = date.getDate();
      }
    }
    dayCnt++;

    var start = 0;
    var end = 0;
    var check = 0;
    for (var i=0; i<dayCnt; i++) {
      eatPer30[0] = 0;
      for (var j=0; j<rows.length; j++) {
        if (day[i] === new Date(rows[j].time).getDate()) {
          check = 1;
          var hour = new Date(rows[j].time).getHours();
          var minute = new Date(rows[j].time).getMinutes();

          if (minute>30) {
            end = hour*2+1;
          } else {
            end = hour*2;
          }

          for (var k=start+1; k<end; k++) {
            eatPer30[k] = eatPer30[start];
          }
          eatPer30[end] = eatPer30[start]+rows[j].feed*3.9;
          start = end;
        } else {
          if (check === 1) {
            for (var k=start+1; k<48; k++) {
              eatPer30[k] = eatPer30[start];
            }
            eatFive.push(eatPer30);
            eatPer30 = new Array(48);
            start = 0;
            check = 0;
          } else {
            continue;
          }
        }
      }
    }

    if (check === 1) {
      for (var k=start+1; k<48; k++) {
        eatPer30[k] = eatPer30[start];
      }
    }
    eatFive.push(eatPer30);

    eatPer30 = eatFive[eatFive.length-1];
    curEat = eatPer30[eatPer30.length-1];
  });

  connection.query('SELECT time, avg_temp, max_temp from act_temp_table where test_number=999 ORDER BY time desc', function(err, rows) {
    if (err) throw err;

    curTemp = rows[rows.length-1].avg_temp;
    curTemp = curTemp.toFixed(1);
  });

  connection.query('SELECT time, avg_heart, max_heart from heart_table where test_number=999 ORDER BY time asc', function(err, rows) {
    if (err) throw err;

    curHrv = rows[rows.length-1].avg_heart;
});

  var curData = [];
  setTimeout(function() {
    curData = [Math.round(curActivity), Math.round(curSleep), curJoint, Math.round(curEat), curTemp, Math.round(curHrv)];
  }, 200);

  setTimeout(function() {
    res.send(JSON.stringify(curData));
  }, 200);
});

// total chart api
app.get('/total', (req, res) => {
  var total = [];
  var totalScore = [0,0,0,0,0,0,0,0,0,0];

  connection.query('SELECT time, DAYOFWEEK(time) AS week_n, CASE DAYOFWEEK(time)' +
      'WHEN \'1\' THEN \'일\' WHEN \'2\' THEN \'월\' WHEN \'3\' THEN \'화\' WHEN \'4\' THEN \'수\'\n' +
      'WHEN \'5\' THEN \'목\' WHEN \'6\' THEN \'금\' WHEN \'7\' THEN \'토\' END AS week from act_temp_table ' +
      'where test_number=999 ORDER BY time asc', function(err, rows) {
    if (err) throw err;

    var weekDay = [];
    var cnt = 0;

    var date = new Date(rows[0].time);
    weekDay[0] = rows[0].week;

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() !== new Date(rows[i].time).getDate()) {
        cnt++;
        date = new Date(rows[i].time);
        weekDay[cnt] = rows[i].week;
      }
    }

    total.push(weekDay);
  });

  connection.query('SELECT time, stat1, stat2, stat3, stat4 from act_temp_table where test_number=999 ORDER BY time asc', function(err, rows) {
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
        activityDay[cnt] /= 60;
        playDay[cnt] /= 60;
        cnt++;
        date = new Date(rows[i].time);
        activityDay[cnt] = (rows[i].stat1 + rows[i].stat2 + rows[i].stat3 + rows[i].stat4)/120;
        playDay[cnt] = rows[i].stat3/120;
      }
    }
    activityDay[cnt] /= 60;
    playDay[cnt] /= 60;

    // activityDay.reverse();
    // playDay.reverse();

    // activity.push(activityDay);
    // activity.push(playDay);

    // var totalActivity = [];
    for (var i=0; i<activityDay.length; i++) {
      if (activityDay[i]>=4 && activityDay[i]<=8) {
        // totalActivity[i] = 20;
        totalScore[i] += 20;
      } else if (activityDay[i]>=2 && activityDay[i]<=10) {
        // totalActivity[i] = 10;
        totalScore[i] += 10;
      }
      // }  else {
        // totalActivity[i] = 0;
      // }
    }
    console.log('activity: ', totalScore);

    // total.push(totalActivity);
    // totalScore = totalActivity;
  });

  connection.query('SELECT time, stat0 from act_temp_table where test_number=999 ORDER BY time asc', function(err, rows) {
    var sleepDay = [];
    // var sleepPer30 = new Array(48);
    var cnt = 0;
    var fiveBefore = 0;

    var date = new Date(rows[0].time);
    sleepDay[0] = 0;
    // var check = 1;

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() === new Date(rows[i].time).getDate()) {
        if (rows[i].stat0/120 < 4 && fiveBefore < 4) {
          fiveBefore = rows[i].stat0/120;
        } else {
          sleepDay[cnt] += rows[i].stat0/120;
          fiveBefore = rows[i].stat0/120;
        }
      } else {
        sleepDay[cnt] /= 60;
        date = new Date(rows[i].time);
        cnt++;

        if (rows[i].stat0/120 < 4 && fiveBefore < 4) {
          sleepDay[cnt] = 0;
          fiveBefore = rows[i].stat0/120;
        } else {
          sleepDay[cnt] = rows[i].stat0/120;
          fiveBefore = rows[i].stat0/120;
        }
      }
    }
    sleepDay[cnt] /= 60;

    // sleep.push(sleepDay);
    // var totalSleep = [];
    for (var i=0; i<sleepDay.length; i++) {
      if (sleepDay[i]>=11 && sleepDay[i]<=18) {
        // totalSleep[i] = 20;
        totalScore[i] += 20;
      } else if (sleepDay[i]>=8 && sleepDay[i]<=20) {
        // totalSleep[i] = 10;
        totalScore[i] += 10;
      }
      // } else {
      //   totalSleep[i] = 0;
      // }
    }
    console.log('sleep: ', totalScore);

    // total.push(totalSleep);
  });

  connection.query('SELECT time, stat3, stat4 from act_temp_table where test_number=999 ORDER BY time desc', function(err, rows) {
    var jointWarn = [];
    var jointDanger = [];
    var sumStat3 = 0;
    var sumStat4 = 0;
    var sum = 0;
    var cnt = 0;

    var date = new Date(rows[0].time);
    var check = 1;

    jointWarn[0] = 0;
    jointDanger[0] = 0;

    for (var i=0; i<rows.length; i+=6) {
      for (var j=0; j<6; j++) {
        if (i+j >= rows.length) {
          check = 0;
          break;
        }

        if (date.getDate() === new Date(rows[i+j].time).getDate()) {
          sumStat3 += rows[i+j].stat3;
          sumStat4 += rows[i+j].stat4*2;
        } else {
          sumStat3 = rows[i+j].stat3;
          sumStat4 = rows[i+j].stat4*2;
          date = new Date(rows[i+j].time);
          cnt++;

          jointWarn[cnt] = 0;
          jointDanger[cnt] = 0;
        }
      }

      if (sumStat3 >= 240) {
        sum = sumStat3 + sumStat4;
      } else {
        sum = sumStat4;
      }

      if (sum>=720) {
        jointDanger[cnt]++;
      } else if (sum>=360) {
        jointWarn[cnt]++;
      }

      sumStat3 = 0;
      sumStat4 = 0;

      if (check === 0) {
        break;
      }
    }

    jointWarn.reverse();
    jointDanger.reverse();
    // console.log(jointWarn, jointDanger);
    // joint.push(jointWarn, jointDanger);

    // var totalJoint = [];
    for (var i=0; i<jointDanger.length; i++) {
      if (jointDanger[i]>=16) {
        // totalJoint[i] = 0;
        totalScore[i] += 0;
      } else if (jointWarn[i]>=16) {
        // totalJoint[i] = 10;
        totalScore[i] += 10;
      } else {
        // totalJoint[i] = 20;
        totalScore[i] += 20
      }
    }
    console.log('joint: ', totalScore);

    // total.push(totalJoint);
  });

  connection.query('SELECT time, feed from feed_table ORDER BY time asc', function(err, rows) {
    if (err) throw err;

    var eatDay = [];
    var cnt = 0;

    var date = new Date(rows[0].time);
    eatDay[0] = 0;

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() === new Date(rows[i].time).getDate()) {
        eatDay[cnt] += rows[i].feed*3.9;
      } else {
        cnt++;
        date = new Date(rows[i].time);
        eatDay[cnt] = rows[i].feed*3.9;
      }
    }

    // eatDay.reverse();
    // eat.push(eatDay);
    // var totalEat = [];
    var thirtyPercent = 3.5*0.3*3.9; // 4.095
    var fiftyPercent = 3.5*0.5*3.9;  // 6.825
    var rer = 30*3.5+70;  // 175
    for (var i=0; i<eatDay.length; i++) {
      if (eatDay[i]>=(rer-thirtyPercent) && eatDay[i]<=(rer+thirtyPercent)) {
        // totalEat[i] = 20;
        totalScore[i] += 20;
      } else if (eatDay[i]>=(rer-fiftyPercent) && eatDay[i]<=(rer+fiftyPercent)) {
        // totalEat[i] = 10;
        totalScore[i] += 10;
      }
      // } else {
      //   totalEat[i] = 0;
      // }
    }
    console.log('eat: ', totalScore);

    // total.push(totalEat);
  });

  connection.query('SELECT time, avg_temp, max_temp from act_temp_table where test_number=999 ORDER BY time desc', function(err, rows) {
    if(err) throw err;

    var avgTemp = [];
    var maxTemp = [];
    var cnt = 0;
    var num = 0;

    var date = new Date(rows[0].time);
    avgTemp[0] = 0;
    maxTemp[0] = 0;

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() === new Date(rows[i].time).getDate()) {
        avgTemp[cnt] += rows[i].avg_temp;
        maxTemp[cnt] = Math.max(maxTemp[cnt], rows[i].max_temp);
      } else {
        cnt++;
        avgTemp[cnt-1] /= (i-num);
        date = new Date(rows[i].time);
        avgTemp[cnt] = rows[i].avg_temp;
        maxTemp[cnt] = rows[i].max_temp;
        num = i;
      }
    }
    avgTemp[cnt] /= (i-num);

    avgTemp.reverse();
    maxTemp.reverse();
    // temperature.push(maxTemp, avgTemp);

    // var totalTemp = [];
    for (var i=0; i<avgTemp.length; i++) {
      if (avgTemp[i]>=15 && avgTemp[i]<=34) {
        // totalTemp[i] = 20;
        totalScore[i] += 20;
      } else if (avgTemp[i]>=5 && avgTemp[i]<=37) {
        // totalTemp[i] = 10;
        totalScore[i] += 10;
      }
      // } else {
      //   totalTemp[i] = 0;
      // }
    }
    console.log('temp: ', totalScore);

    // total.push(totalTemp);
  });

  connection.query('SELECT time, avg_heart, max_heart from heart_table where test_number=999 ORDER BY time asc', function(err, rows) {
    if(err) throw err;

    var hrvAvg = [];
    var hrvMax = [];
    var cnt = 0;
    var divide = 0;

    var date = new Date(rows[0].time);
    hrvAvg[0] = 0;
    hrvMax[0] = 0;

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() === new Date(rows[i].time).getDate()) {
        hrvAvg[cnt] += rows[i].avg_heart;
        hrvMax[cnt] = Math.max(hrvMax[cnt], rows[i].max_heart);
        divide++;
      } else {
        hrvAvg[cnt] /= divide;
        date = new Date(rows[i].time);
        cnt++;
        divide = 1;

        hrvAvg[cnt] = rows[i].avg_heart;
        hrvMax[cnt] = rows[i].max_heart;
      }
    }
    hrvAvg[cnt] /= divide;

    // hrv.push(hrvMax, hrvAvg);
    for (var i=0; i<hrvAvg.length; i++) {
      if (hrvAvg[i]>=70 && hrvAvg[i]<=130) {
        totalScore[i] += 20;
      } else if (hrvAvg[i]>=60 && hrvAvg[i]<=140) {
        totalScore[i] += 10;
      }
    }
  });

  setTimeout(function() {
    total.push(totalScore);
    console.log(totalScore);
  }, 200);

  setTimeout(function() {
    res.send(JSON.stringify(total));
    console.log(total);
  }, 200);
});

// activity day chart api
app.get('/activity/day', (req, res) => {
  var activity = [];

  connection.query('SELECT time, stat1, stat2, stat3, stat4 from act_temp_table where test_number=999 ORDER BY time desc', function(err, rows) {
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
        activityDay[cnt] /= 60;
        playDay[cnt] /= 60;
        cnt++;
        date = new Date(rows[i].time);
        activityDay[cnt] = (rows[i].stat1 + rows[i].stat2 + rows[i].stat3 + rows[i].stat4)/120;
        playDay[cnt] = rows[i].stat3/120;
      }
    }
    activityDay[cnt] /= 60;
    playDay[cnt] /= 60;

    activityDay.reverse();
    playDay.reverse();

    activity.push(activityDay);
    activity.push(playDay);
  });

  connection.query('SELECT time, DAYOFWEEK(time) AS week_n, CASE DAYOFWEEK(time)' +
      'WHEN \'1\' THEN \'일\' WHEN \'2\' THEN \'월\' WHEN \'3\' THEN \'화\' WHEN \'4\' THEN \'수\'\n' +
      'WHEN \'5\' THEN \'목\' WHEN \'6\' THEN \'금\' WHEN \'7\' THEN \'토\' END AS week from act_temp_table ' +
      'where test_number=999 ORDER BY time desc', function(err, rows) {
    if (err) throw err;

    var weekDay = [];
    var cnt = 0;

    var date = new Date(rows[0].time);
    weekDay[0] = rows[0].week;

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
      'WHEN \'5\' THEN \'목\' WHEN \'6\' THEN \'금\' WHEN \'7\' THEN \'토\' END AS week from act_temp_table ' +
      'where test_number=999 ORDER BY time desc', function(err, rows) {
    if (err) throw err;

    var activityList = [];
    var activityPerList = [];
    var sum = 0;

    var date = new Date(rows[0].time);
    var str = String(date.getMonth() + 1) + '월 ' + String(date.getDate()) + '일 (' + rows[0].week + ')';
    activityPerList.push(str);
    // var check = 1;

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() === new Date(rows[i].time).getDate()) {
        sum += (rows[i].stat1 + rows[i].stat2 + rows[i].stat3 + rows[i].stat4)/120;
      } else {
        activityPerList.push(sum/60);
        activityList.push(activityPerList);

        date = new Date(rows[i].time);
        activityPerList = [];
        str = String(date.getMonth() + 1) + '월 ' + String(date.getDate()) + '일 (' + rows[i].week + ')';
        activityPerList.push(str);
        sum = (rows[i].stat1 + rows[i].stat2 + rows[i].stat3 + rows[i].stat4)/120;
      }
    }
    activityPerList.push(sum/60);
    activityList.push(activityPerList);

    // [["11월 12일 (화)",0],["11월 11일 (월)",3],["11월 10일 (일)",4],["11월 9일 (토)",3],["11월 12일 (화)",0],["11월 13일 (수)",0]]
    // for (var i = 0; i < rows.length; i += 6) {
    //   for (var j = 0; j < 6; j++) {
    //     if (i + j >= rows.length) {
    //       check = 0;
    //       break;
    //     }
    //
    //     if (date.getDate() === new Date(rows[i + j].time).getDate()) {
    //       sum += (rows[i + j].stat1 + rows[i + j].stat2 + rows[i + j].stat3 + rows[i + j].stat4) / 120;
    //     } else {
    //       activityPerList.push(Math.round(sum/60));
    //       activityList.push(activityPerList);
    //
    //       date = new Date(rows[i + j].time);
    //       activityPerList = [];
    //       str = String(date.getMonth() + 1) + '월 ' + String(date.getDate()) + '일 (' + rows[i+j].week + ')';
    //       activityPerList.push(str);
    //       sum = 0;
    //     }
    //
    //     if (check === 0) {
    //       activityPerList.push(Math.round(sum/60));
    //       activityList.push(activityPerList);
    //       break;
    //     }
    //   }
    // }

    res.send(JSON.stringify(activityList));
  })
});

// activity list chart api
app.get('/activity/five', cors(), (req, res) => {
  connection.query('SELECT time, stat1, stat2, stat3, stat4 from act_temp_table where test_number=999 ORDER BY time asc', function(err, rows) {
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
          activityPer30[cnt] = (rows[i+j].stat1 + rows[i+j].stat2 + rows[i+j].stat3 + rows[i+j].stat4)/120;
          // break;
        }
      }
      cnt++;

      if (check === 0) {
        // activityFive.push(activityPer30);
        break;
      }
    }
    activityFive.push(activityPer30);

    activityFive.reverse();
    res.send(JSON.stringify(activityFive));
  });
});

// sleep day chart api
app.get('/sleep/day', (req, res) => {
  var sleep = [];

  // connection.query('SELECT sleep from sleep_table_h', function(err, rows) {
  //   if (err) throw err;
  //
  //   var sleepDay = new Array(rows.length/288);
  //   var cnt = 0;
  //
  //   for (var i=0; i<rows.length; i+=288) {
  //     sleepDay[cnt] = 0;
  //     for (var j=0; j<288; j++) {
  //       sleepDay[cnt] += rows[i+j].sleep;
  //     }
  //     cnt++;
  //   }
  //
  //   // res.send(JSON.stringify(sleepDay));
  //   sleep.push(sleepDay);
  // });

  connection.query('SELECT time, stat0 from act_temp_table where test_number=999 ORDER BY time asc', function(err, rows) {
    var sleepDay = [];
    // var sleepPer30 = new Array(48);
    var cnt = 0;
    var fiveBefore = 0;

    var date = new Date(rows[0].time);
    sleepDay[0] = 0;
    // var check = 1;

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() === new Date(rows[i].time).getDate()) {
        if (rows[i].stat0/120 < 4 && fiveBefore < 4) {
          fiveBefore = rows[i].stat0/120;
        } else {
          sleepDay[cnt] += rows[i].stat0/120;
          fiveBefore = rows[i].stat0/120;
        }
      } else {
        sleepDay[cnt] /= 60;
        date = new Date(rows[i].time);
        cnt++;

        if (rows[i].stat0/120 < 4 && fiveBefore < 4) {
          sleepDay[cnt] = 0;
          fiveBefore = rows[i].stat0/120;
        } else {
          sleepDay[cnt] = rows[i].stat0/120;
          fiveBefore = rows[i].stat0/120;
        }
      }
    }
    sleepDay[cnt] /= 60;

    sleep.push(sleepDay);
  });

  connection.query('SELECT time, DAYOFWEEK(time) AS week_n, CASE DAYOFWEEK(time)' +
      'WHEN \'1\' THEN \'일\' WHEN \'2\' THEN \'월\' WHEN \'3\' THEN \'화\' WHEN \'4\' THEN \'수\'\n' +
      'WHEN \'5\' THEN \'목\' WHEN \'6\' THEN \'금\' WHEN \'7\' THEN \'토\' END AS week from act_temp_table ' +
      'where test_number=999 ORDER BY time desc', function(err, rows) {
    var weekDay = [];
    var cnt = 0;

    var date = new Date(rows[0].time);
    weekDay[0] = rows[0].week;

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() !== new Date(rows[i].time).getDate()) {
        cnt++;
        date = new Date(rows[i].time);
        weekDay[cnt] = rows[i].week;
      }
    }

    weekDay.reverse();
    sleep.push(weekDay);
  });

  setTimeout(function() {
    res.send(JSON.stringify(sleep));
  }, 100);
});

// sleep list chart time part api
app.get('/sleep/list', (req, res) => {
  connection.query('SELECT stat0, time, DAYOFWEEK(time) AS week_n, CASE DAYOFWEEK(time)' +
      'WHEN \'1\' THEN \'일\' WHEN \'2\' THEN \'월\' WHEN \'3\' THEN \'화\' WHEN \'4\' THEN \'수\'\n' +
      'WHEN \'5\' THEN \'목\' WHEN \'6\' THEN \'금\' WHEN \'7\' THEN \'토\' END AS week from act_temp_table ' +
      'where test_number=999 ORDER BY time asc', function(err, rows) {
    var sleepList = [];
    var sleepPerList = [];
    // var sleepPer30 = new Array(48);
    // var cnt = 0;
    var sum = 0;
    var fiveBefore = 0;

    var date = new Date(rows[0].time);
    var str = String(date.getMonth() + 1) + '월 ' + String(date.getDate()) + '일 (' + rows[0].week + ')';
    sleepPerList.push(str);
    var check = 1;

    for (var i=0; i<rows.length; i+=6) {
      // sleepPer30[cnt] = 0;
      for (var j=0; j<6; j++) {
        if (i+j >= rows.length) {
          check = 0;
          break;
        }

        if (date.getDate() === new Date(rows[i+j].time).getDate()) {
          if (rows[i+j].stat0/120 >= 4) {
            // sleepPer30[cnt] += rows[i+j].stat0/120;
            sum += rows[i+j].stat0/120;
            fiveBefore = rows[i+j].stat0/120;
          } else {
            if (fiveBefore >= 4) {
              // sleepPer30[cnt] += rows[i+j].stat0/120;
              sum += rows[i+j].stat0/120;
              fiveBefore = rows[i+j].stat0/120;
            } else {
              fiveBefore = rows[i+j].stat0/120;
            }
          }
        } else {
          // sleepList.push(sleepPer30);
          sleepPerList.push(sum/60);
          sleepList.push(sleepPerList);
          // sleepPer30 = new Array(48);
          sleepPerList = [];
          date = new Date(rows[i+j].time);
          str = String(date.getMonth() + 1) + '월 ' + String(date.getDate()) + '일 (' + rows[i+j].week + ')';
          sleepPerList.push(str);
          // cnt = 0;

          if (rows[i+j].stat0/120 >= 4) {
            // sleepPer30[cnt] = rows[i+j].stat0/120;
            sum = rows[i+j].stat0/120;
          } else {
            // sleepPer30[cnt] = 0;
            sum = 0;
          }
          fiveBefore = rows[i+j].stat0/120;
        }
      }
      // cnt++;

      if (check === 0) {
        // sleepList.push(sleepPer30);
        // sleepPerList.push(sum/60);
        // sleepList.push(sleepPerList);
        break;
      }
    }
    sleepPerList.push(sum/60);
    sleepList.push(sleepPerList);

    sleepList.reverse();
    res.send(JSON.stringify(sleepList));
  })
});

// sleep list chart api
app.get('/sleep/five', (req, res) => {
  connection.query('SELECT time, stat0 from act_temp_table where test_number=999 ORDER BY time asc', function(err, rows) {
    var sleepList = [];
    var sleepPer30 = new Array(48);
    var cnt = 0;
    var fiveBefore = 0;

    var date = new Date(rows[0].time);
    var check = 1;

    for (var i=0; i<rows.length; i+=6) {
      sleepPer30[cnt] = 0;
      for (var j=0; j<6; j++) {
        if (i+j >= rows.length) {
          check = 0;
          break;
        }

        if (date.getDate() === new Date(rows[i+j].time).getDate()) {
          if (rows[i+j].stat0/120 >= 4) {
            sleepPer30[cnt] += rows[i+j].stat0/120;
            fiveBefore = rows[i+j].stat0/120;
          } else {
            if (fiveBefore >= 4) {
              sleepPer30[cnt] += rows[i+j].stat0/120;
              fiveBefore = rows[i+j].stat0/120;
            } else {
              fiveBefore = rows[i+j].stat0/120;
            }
          }
        } else {
          sleepList.push(sleepPer30);
          sleepPer30 = new Array(48);
          date = new Date(rows[i+j].time);
          cnt = 0;

          if (rows[i+j].stat0/120 >= 4) {
            sleepPer30[cnt] = rows[i+j].stat0/120;
          } else {
            sleepPer30[cnt] = 0;
          }
          fiveBefore = rows[i+j].stat0/120;
        }
      }
      cnt++;

      if (check === 0) {
        // sleepList.push(sleepPer30);
        break;
      }
    }
    sleepList.push(sleepPer30);

    sleepList.reverse();
    res.send(JSON.stringify(sleepList));
  });
});

// joint day chart api
app.get('/joint/day', (req, res) => {
  var joint = [];

  connection.query('SELECT time, stat3, stat4 from act_temp_table where test_number=999 ORDER BY time desc', function(err, rows) {
    var jointWarn = [];
    var jointDanger = [];
    var sumStat3 = 0;
    var sumStat4 = 0;
    var sum = 0;
    var cnt = 0;

    var date = new Date(rows[0].time);
    var check = 1;

    jointWarn[0] = 0;
    jointDanger[0] = 0;

    for (var i=0; i<rows.length; i+=6) {
      for (var j=0; j<6; j++) {
        if (i+j >= rows.length) {
          check = 0;
          break;
        }

        if (date.getDate() === new Date(rows[i+j].time).getDate()) {
          sumStat3 += rows[i+j].stat3;
          sumStat4 += rows[i+j].stat4*2;
        } else {
          sumStat3 = rows[i+j].stat3;
          sumStat4 = rows[i+j].stat4*2;
          date = new Date(rows[i+j].time);
          cnt++;

          jointWarn[cnt] = 0;
          jointDanger[cnt] = 0;
        }
      }

      if (sumStat3 >= 720) {
        sum = (sumStat3-720) + sumStat4;
      } else {
        sum = sumStat4;
      }

      if (sum>=200) {
        jointDanger[cnt]++;
      } else if (sum>=100) {
        jointWarn[cnt]++;
      }

      sumStat3 = 0;
      sumStat4 = 0;

      if (check === 0) {
        break;
      }
    }

    jointWarn.reverse();
    jointDanger.reverse();
    // console.log(jointWarn, jointDanger);
    joint.push(jointWarn, jointDanger);
  });

  connection.query('SELECT time, DAYOFWEEK(time) AS week_n, CASE DAYOFWEEK(time)' +
      'WHEN \'1\' THEN \'일\' WHEN \'2\' THEN \'월\' WHEN \'3\' THEN \'화\' WHEN \'4\' THEN \'수\'\n' +
      'WHEN \'5\' THEN \'목\' WHEN \'6\' THEN \'금\' WHEN \'7\' THEN \'토\' END AS week from act_temp_table ' +
      'where test_number=999 ORDER BY time desc', function (err, rows) {
    var weekDay = [];
    var cnt = 0;

    var date = new Date(rows[0].time);
    weekDay[0] = rows[0].week;

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() !== new Date(rows[i].time).getDate()) {
        cnt++;
        date = new Date(rows[i].time);
        weekDay[cnt] = rows[i].week;
      }
    }

    weekDay.reverse();
    // console.log(weekDay);
    joint.push(weekDay);
  });

  setTimeout(function() {
    res.send(JSON.stringify(joint));
  }, 100);
});

// joint list chart time part api
app.get('/joint/list', (req, res) => {
  connection.query('SELECT stat3, stat4, time, DAYOFWEEK(time) AS week_n, CASE DAYOFWEEK(time)' +
      'WHEN \'1\' THEN \'일\' WHEN \'2\' THEN \'월\' WHEN \'3\' THEN \'화\' WHEN \'4\' THEN \'수\'\n' +
      'WHEN \'5\' THEN \'목\' WHEN \'6\' THEN \'금\' WHEN \'7\' THEN \'토\' END AS week from act_temp_table ' +
      'where test_number=999 ORDER BY time desc', function(err, rows) {
    var jointList = [];
    var jointPerList = [];
    var jointWarn = [];
    var jointDanger = [];
    var sumStat3 = 0;
    var sumStat4 = 0;
    var sum = 0;
    var cnt = 0;

    var date = new Date(rows[0].time);
    var str = String(date.getMonth() + 1) + '월 ' + String(date.getDate()) + '일 (' + rows[0].week + ')';
    jointPerList.push(str);
    var check = 1;

    jointWarn[0] = 0;
    jointDanger[0] = 0;

    for (var i=0; i<rows.length; i+=6) {
      for (var j=0; j<6; j++) {
        if (i+j >= rows.length) {
          check = 0;
          break;
        }

        if (date.getDate() === new Date(rows[i+j].time).getDate()) {
          sumStat3 += rows[i+j].stat3;
          sumStat4 += rows[i+j].stat4*2;
        } else {
          if (jointDanger[cnt] >= 16) {
            jointPerList.push('평균 위험');
          } else if(jointWarn[cnt] >= 16) {
            jointPerList.push('평균 경고');
          } else {
            jointPerList.push('평균 양호');
          }

          jointList.push(jointPerList);
          jointPerList = [];

          sumStat3 = rows[i+j].stat3;
          sumStat4 = rows[i+j].stat4*2;

          date = new Date(rows[i+j].time);
          str = String(date.getMonth() + 1) + '월 ' + String(date.getDate()) + '일 (' + rows[i+j].week + ')';
          jointPerList.push(str);
          cnt++;

          jointWarn[cnt] = 0;
          jointDanger[cnt] = 0;
        }
      }

      if (sumStat3 >= 720) {
        sum = (sumStat3-720) + sumStat4;
      } else {
        sum = sumStat4;
      }

      if (sum>=200) {
        jointDanger[cnt]++;
      } else if (sum>=100) {
        jointWarn[cnt]++;
      }

      sumStat3 = 0;
      sumStat4 = 0;

      if (check === 0) {
        // if (jointDanger[cnt] >= 16) {
        //   jointPerList.push('평균 위험');
        // } else if(jointWarn[cnt] >= 16) {
        //   jointPerList.push('평균 경고');
        // } else {
        //   jointPerList.push('평균 양호');
        // }
        //
        // jointList.push(jointPerList);

        break;
      }
    }

    if (jointDanger[cnt] >= 16) {
      jointPerList.push('평균 위험');
    } else if(jointWarn[cnt] >= 16) {
      jointPerList.push('평균 경고');
    } else {
      jointPerList.push('평균 양호');
    }

    jointList.push(jointPerList);

    // jointWarn.reverse();
    // jointDanger.reverse();
    // console.log(jointWarn, jointDanger);
    // joint.push(jointWarn, jointDanger);
    // console.log(jointList);
    res.send(JSON.stringify(jointList));
  })
});

// joint list chart api
app.get('/joint/five', (req, res) => {
  connection.query('SELECT time, stat3, stat4 from act_temp_table where test_number=999 ORDER BY time asc',  function(err, rows) {
    var jointFive = [];
    var jointPer30 = new Array(48);
    // var jointWarn = [];
    // var jointDanger = [];
    var sumStat3 = 0;
    var sumStat4 = 0;
    var sum = 0;
    var cnt = 0;

    var date = new Date(rows[0].time);
    // var str = String(date.getMonth() + 1) + '월 ' + String(date.getDate()) + '일 (' + rows[0].week + ')';
    // jointPerList.push(str);
    var check = 1;

    // jointWarn[0] = 0;
    // jointDanger[0] = 0;

    for (var i = 0; i < rows.length; i += 6) {
      jointPer30[cnt] = 0;
      for (var j = 0; j < 6; j++) {
        if (i + j >= rows.length) {
          check = 0;
          break;
        }

        if (date.getDate() === new Date(rows[i + j].time).getDate()) {
          // console.log(date.getDate(), rows[i+j].stat4, cnt);
          sumStat3 += rows[i + j].stat3;
          sumStat4 += rows[i + j].stat4 * 2;
          // console.log(date.getDate(), sumStat4, cnt);
        } else {
          // if (jointDanger[cnt] >= 16) {
          //   jointPerList.push('평균 위험');
          // } else if (jointWarn[cnt] >= 16) {
          //   jointPerList.push('평균 경고');
          // } else {
          //   jointPerList.push('평균 양호');
          // }

          // jointList.push(jointPerList);
          // jointPerList = [];
          if (sumStat3 >= 720) {
            sum = (sumStat3-720) + sumStat4;
          } else {
            sum = sumStat4;
          }

          jointPer30[cnt] = sum;

          jointFive.push(jointPer30);
          // console.log(date.getDate(), jointPer30);
          jointPer30 = new Array(48);

          sumStat3 = rows[i + j].stat3;
          sumStat4 = rows[i + j].stat4 * 2;

          date = new Date(rows[i + j].time);
          // str = String(date.getMonth() + 1) + '월 ' + String(date.getDate()) + '일 (' + rows[i + j].week + ')';
          // jointPerList.push(str);
          cnt = 0;

          // jointWarn[cnt] = 0;
          // jointDanger[cnt] = 0;
        }
      }
      // console.log(date.getDate(), sumStat4, cnt);

      if (sumStat3 >= 720) {
        sum = (sumStat3-720) + sumStat4;
        // console.log('sumStat3: ', date.getDate(), sumStat3-720, sumStat4, sum);
      } else {
        sum = sumStat4;
        // console.log('sumStat4: ', date.getDate(), sumStat4, sum);
      }

      jointPer30[cnt] = sum;
      // console.log(date.getDate(), jointPer30);
      // console.log(date.getDate(), jointPer30);
      sumStat3 = 0;
      sumStat4 = 0;
      cnt++;

      // if (sum >= 3600) {
      //   jointDanger[cnt]++;
      // } else if (sum >= 1800) {
      //   jointWarn[cnt]++;
      // }

      if (check === 0) {
        // if (jointDanger[cnt] >= 16) {
        //   jointPerList.push('평균 위험');
        // } else if (jointWarn[cnt] >= 16) {
        //   jointPerList.push('평균 경고');
        // } else {
        //   jointPerList.push('평균 양호');
        // }
        //
        // jointList.push(jointPerList);

        // jointFive.push(jointPer30);

        break;
      }
    }
    jointFive.push(jointPer30);
    // console.log(date.getDate(), jointPer30);

    jointFive.reverse();
    // console.log(jointFive);
    res.send(JSON.stringify(jointFive));
  });
});

// eat day chart api
app.get('/eat/day', (req, res) => {
  var eat = [];

  // connection.query('SELECT time, feed from feed_table where test_number=999 ORDER BY time desc', function(err, rows) {
  connection.query('SELECT time, feed from feed_table ORDER BY time asc', function(err, rows) {
    if (err) throw err;

    var eatDay = [];
    var cnt = 0;

    var date = new Date(rows[0].time);
    eatDay[0] = 0;

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() === new Date(rows[i].time).getDate()) {
        eatDay[cnt] += rows[i].feed*3.9;
      } else {
        cnt++;
        date = new Date(rows[i].time);
        eatDay[cnt] = rows[i].feed*3.9;
      }
    }

    // eatDay.reverse();
    eat.push(eatDay);
  });

  // connection.query('SELECT time, DAYOFWEEK(time) AS week_n, CASE DAYOFWEEK(time)' +
  //   //     'WHEN \'1\' THEN \'일\' WHEN \'2\' THEN \'월\' WHEN \'3\' THEN \'화\' WHEN \'4\' THEN \'수\'\n' +
  //   //     'WHEN \'5\' THEN \'목\' WHEN \'6\' THEN \'금\' WHEN \'7\' THEN \'토\' END AS week from act_temp_table ' +
  //   //     'where test_number=999 ORDER BY time desc', function(err, rows) {
  connection.query('SELECT time, DAYOFWEEK(time) AS week_n, CASE DAYOFWEEK(time)' +
        'WHEN \'1\' THEN \'일\' WHEN \'2\' THEN \'월\' WHEN \'3\' THEN \'화\' WHEN \'4\' THEN \'수\'\n' +
        'WHEN \'5\' THEN \'목\' WHEN \'6\' THEN \'금\' WHEN \'7\' THEN \'토\' END AS week from feed_table ORDER BY time asc', function(err, rows) {
    if (err) throw err;

    var weekDay = [];
    var cnt = 0;

    var date = new Date(rows[0].time);
    weekDay[0] = rows[0].week;

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() !== new Date(rows[i].time).getDate()) {
        cnt++;
        date = new Date(rows[i].time);
        weekDay[cnt] = rows[i].week;
      }
    }

    // weekDay.reverse();
    eat.push(weekDay);
  });

  setTimeout(function() {
    res.send(JSON.stringify(eat));
  }, 100);
});

// eat list chart time part api
app.get('/eat/list', (req, res) => {
  connection.query('SELECT feed, time, DAYOFWEEK(time) AS week_n, CASE DAYOFWEEK(time)' +
      'WHEN \'1\' THEN \'일\' WHEN \'2\' THEN \'월\' WHEN \'3\' THEN \'화\' WHEN \'4\' THEN \'수\'\n' +
      'WHEN \'5\' THEN \'목\' WHEN \'6\' THEN \'금\' WHEN \'7\' THEN \'토\' END AS week from feed_table ORDER BY time asc', function(err, rows) {
    var eatList = [];
    var eatPerList = [];
    var sum = 0;

    var date = new Date(rows[0].time);
    var str = String(date.getMonth() + 1) + '월 ' + String(date.getDate()) + '일 (' + rows[0].week + ')';
    eatPerList.push(str);

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() === new Date(rows[i].time).getDate()) {
        sum += rows[i].feed*3.9;
      } else {
        eatPerList.push(sum);
        eatList.push(eatPerList);

        date = new Date(rows[i].time);
        eatPerList = [];
        var str = String(date.getMonth() + 1) + '월 ' + String(date.getDate()) + '일 (' + rows[i].week + ')';
        eatPerList.push(str);
        sum = rows[i].feed*3.9;
      }
    }
    eatPerList.push(sum);
    eatList.push(eatPerList);

    res.send(JSON.stringify(eatList));
  })
});

// eat list chart api
app.get('/eat/five', (req, res) => {
  connection.query('SELECT time, feed from feed_table ORDER BY time asc', function(err, rows) {
    var eatFive = [];
    var day = [];
    var eatPer30 = new Array(48);
    // var cnt = 0;
    var dayCnt = 0;

    var date = new Date(rows[0].time);
    day[0] = date.getDate();

    for (var i=0; i<rows.length; i++) {
      if (day[dayCnt] !== new Date(rows[i].time).getDate()) {
        dayCnt++;
        date = new Date(rows[i].time);
        day[dayCnt] = date.getDate();
      }
    }
    dayCnt++;
    // console.log(dayCnt, day);

    var start = 0;
    var end = 0;
    var check = 0;
    for (var i=0; i<dayCnt; i++) {
      eatPer30[0] = 0;
      for (var j=0; j<rows.length; j++) {
        if (day[i] === new Date(rows[j].time).getDate()) {
          check = 1;
          var hour = new Date(rows[j].time).getHours();
          var minute = new Date(rows[j].time).getMinutes();

          if (minute>30) {
            end = hour*2+1;
          } else {
            end = hour*2;
          }

          for (var k=start+1; k<end; k++) {
            eatPer30[k] = eatPer30[start];
          }
          eatPer30[end] = eatPer30[start]+rows[j].feed*3.9;
          start = end;
        } else {
          if (check === 1) {
            for (var k=start+1; k<48; k++) {
              eatPer30[k] = eatPer30[start];
            }
            eatFive.push(eatPer30);
            eatPer30 = new Array(48);
            start = 0;
            check = 0;
          } else {
            continue;
          }
        }
      }
    }

    if (check === 1) {
      for (var k=start+1; k<48; k++) {
        eatPer30[k] = eatPer30[start];
      }
      // eatFive.push(eatPer30);
    }
    eatFive.push(eatPer30);

    res.send(JSON.stringify(eatFive));
  })
});

// temperature day chart api
app.get('/temperature/day', (req, res) => {
  var temperature = [];

  connection.query('SELECT time, avg_temp, max_temp from act_temp_table where test_number=999 ORDER BY time desc', function(err, rows) {
    if(err) throw err;

    var avgTemp = [];
    var maxTemp = [];
    var cnt = 0;
    var num = 0;

    var date = new Date(rows[0].time);
    avgTemp[0] = 0;
    maxTemp[0] = 0;

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() === new Date(rows[i].time).getDate()) {
        avgTemp[cnt] += rows[i].avg_temp;
        maxTemp[cnt] = Math.max(maxTemp[cnt], rows[i].max_temp);
      } else {
        cnt++;
        avgTemp[cnt-1] /= (i-num);
        date = new Date(rows[i].time);
        avgTemp[cnt] = rows[i].avg_temp;
        maxTemp[cnt] = rows[i].max_temp;
        num = i;
      }
    }
    avgTemp[cnt] /= (i-num);

    avgTemp.reverse();
    maxTemp.reverse();
    temperature.push(maxTemp, avgTemp);
  });

  connection.query('SELECT time, DAYOFWEEK(time) AS week_n, CASE DAYOFWEEK(time)' +
      'WHEN \'1\' THEN \'일\' WHEN \'2\' THEN \'월\' WHEN \'3\' THEN \'화\' WHEN \'4\' THEN \'수\'\n' +
      'WHEN \'5\' THEN \'목\' WHEN \'6\' THEN \'금\' WHEN \'7\' THEN \'토\' END AS week from act_temp_table ' +
      'where test_number=999 ORDER BY time desc', function(err, rows) {
    if(err) throw err;

    var weekDay = [];
    var cnt = 0;

    var date = new Date(rows[0].time);
    weekDay[0] = rows[0].week;

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() !== new Date(rows[i].time).getDate()) {
        cnt++;
        date = new Date(rows[i].time);
        weekDay.push(rows[i].week);
      }
    }

    weekDay.reverse();
    temperature.push(weekDay);
  });

  setTimeout(function() {
    res.send(JSON.stringify(temperature));
  }, 100);
});

// temperature list chart time part api
app.get('/temperature/list', (req, res) => {
  connection.query('SELECT avg_temp, max_temp, time, DAYOFWEEK(time) AS week_n, CASE DAYOFWEEK(time)' +
      'WHEN \'1\' THEN \'일\' WHEN \'2\' THEN \'월\' WHEN \'3\' THEN \'화\' WHEN \'4\' THEN \'수\'\n' +
      'WHEN \'5\' THEN \'목\' WHEN \'6\' THEN \'금\' WHEN \'7\' THEN \'토\' END AS week from act_temp_table ' +
      'where test_number=999 ORDER BY time desc', function(err, rows) {
    if (err) throw err;

    var tempList = [];
    var tempPerList = [];
    var sum = 0;
    var max = 0;
    var sumForDivide = 0;

    var date = new Date(rows[0].time);
    var str = String(date.getMonth() + 1) + '월 ' + String(date.getDate()) + '일 (' + rows[0].week + ')';
    tempPerList.push(str);
    // var check = 1;

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() === new Date(rows[i].time).getDate()) {
        sum += rows[i].avg_temp;
        max = Math.max(max, rows[i].max_temp);
        sumForDivide++;
      } else {
        tempPerList.push(max,sum/sumForDivide);
        tempList.push(tempPerList);

        date = new Date(rows[i].time);
        tempPerList = [];
        str = String(date.getMonth() + 1) + '월 ' + String(date.getDate()) + '일 (' + rows[i].week + ')';
        tempPerList.push(str);

        sum = rows[i].avg_temp;
        max = rows[i].max_temp;
        sumForDivide = 1;
      }
    }
    // tempPerList.push(max, Math.round(sum/sumForDivide));
    tempPerList.push(max, sum/sumForDivide);
    tempList.push(tempPerList);

    // [["11월 12일 (화)",33.39,30],["11월 11일 (월)",33.39,30],["11월 10일 (일)",33.39,30]]
    // for (var i = 0; i < rows.length; i += 6) {
    //   for (var j = 0; j < 6; j++) {
    //     if (i + j >= rows.length) {
    //       check = 0;
    //       break;
    //     }
    //
    //     if (date.getDate() === new Date(rows[i+j].time).getDate()) {
    //       sum += rows[i+j].avg_temp;
    //       max = Math.max(max, rows[i+j].max_temp);
    //       sumForDivide++;
    //     } else {
    //       tempPerList.push(max, Math.round(sum/sumForDivide));
    //       tempList.push(tempPerList);
    //
    //       date = new Date(rows[i + j].time);
    //       tempPerList = [];
    //       str = String(date.getMonth() + 1) + '월 ' + String(date.getDate()) + '일 (' + rows[i+j].week + ')';
    //       tempPerList.push(str);
    //
    //       sum = 0;
    //       max = 0;
    //       sumForDivide = 0;
    //     }
    //
    //     if (check === 0) {
    //       tempPerList.push(max, Math.round(sum/sumForDivide));
    //       tempList.push(tempPerList);
    //       break;
    //     }
    //   }
    // }

    res.send(JSON.stringify(tempList));
  })
});

// temperature list chart api
app.get('/temperature/five', (req, res) => {
  connection.query('SELECT time, avg_temp, max_temp from act_temp_table where test_number=999 ORDER BY time desc', function(err, rows) {
    if (err) throw err;

    var tempFive = [];
    // var tempAvg = [];
    // var tempMax = [];
    var tempAvgPer30 = new Array(48);
    var tempMaxPer30 = new Array(48);
    var tempAvgDivide = new Array(48);
    var cnt=0;

    var date = new Date(rows[0].time);
    var check = 1;
    // var num = 5;

    for (var i=0; i<rows.length; i+=6) {
      tempAvgPer30[cnt] = 0;
      tempMaxPer30[cnt] = 0;
      tempAvgDivide[cnt] = 0;
      for (var j=0; j<6; j++) {
        if (i+j >= rows.length) {
          check = 0;
          break;
        }

        if (date.getDate() === new Date(rows[i+j].time).getDate()) {
          tempAvgPer30[cnt] += rows[i+j].avg_temp;
          tempMaxPer30[cnt] = Math.max(tempMaxPer30[cnt], rows[i+j].max_temp);
          tempAvgDivide[cnt]++;
        } else {
          tempAvgPer30[cnt] /= tempAvgDivide[cnt];
          tempMaxPer30[cnt] = Math.max(tempMaxPer30[cnt], rows[i+j].max_temp);
          date = new Date(rows[i+j].time);
          tempFive.push(tempMaxPer30, tempAvgPer30);

          tempAvgPer30 = new Array(48);
          tempMaxPer30 = new Array(48);
          tempAvgDivide = new Array(48);
          cnt = 0;

          tempAvgPer30[cnt] = rows[i+j].avg_temp;
          tempMaxPer30[cnt] = rows[i+j].max_temp;
          tempAvgDivide[cnt] = 1;
        }
      }
      tempAvgPer30[cnt] /= tempAvgDivide[cnt];
      cnt++;

      if (check === 0) {
        // tempFive.push(tempMaxPer30, tempAvgPer30);
        break;
      }
    }
    tempFive.push(tempMaxPer30, tempAvgPer30);

    res.send(JSON.stringify(tempFive));
  });
});

// hrv day chart api
app.get('/hrv/day', (req, res) => {
  var hrv = [];

  connection.query('SELECT time, avg_heart, max_heart from heart_table where test_number=999 ORDER BY time asc', function(err, rows) {
    if(err) throw err;

    var hrvAvg = [];
    var hrvMax = [];
    var cnt = 0;
    var divide = 0;

    var date = new Date(rows[0].time);
    hrvAvg[0] = 0;
    hrvMax[0] = 0;

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() === new Date(rows[i].time).getDate()) {
        hrvAvg[cnt] += rows[i].avg_heart;
        hrvMax[cnt] = Math.max(hrvMax[cnt], rows[i].max_heart);
        divide++;
      } else {
        hrvAvg[cnt] /= divide;
        date = new Date(rows[i].time);
        cnt++;
        divide = 1;

        hrvAvg[cnt] = rows[i].avg_heart;
        hrvMax[cnt] = rows[i].max_heart;
      }
    }
    hrvAvg[cnt] /= divide;

    hrv.push(hrvMax, hrvAvg);
  });

  connection.query('SELECT time, DAYOFWEEK(time) AS week_n, CASE DAYOFWEEK(time)' +
      'WHEN \'1\' THEN \'일\' WHEN \'2\' THEN \'월\' WHEN \'3\' THEN \'화\' WHEN \'4\' THEN \'수\'\n' +
      'WHEN \'5\' THEN \'목\' WHEN \'6\' THEN \'금\' WHEN \'7\' THEN \'토\' END AS week from heart_table ' +
      'where test_number=999 ORDER BY time asc', function(err, rows) {
    var weekDay = [];
    var date = new Date(rows[0].time);
    var cnt = 0;
    weekDay[0] = rows[0].week;

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() !== new Date(rows[i].time).getDate()) {
        cnt++;
        date = new Date(rows[i].time);
        weekDay[cnt] = rows[i].week;
      }
    }

    hrv.push(weekDay);
  });

  setTimeout(function() {
    res.send(JSON.stringify(hrv));
  },100);
});

// hrv list chart time part api
app.get('/hrv/list', (req, res) => {
  connection.query('SELECT avg_heart, max_heart, time, DAYOFWEEK(time) AS week_n, CASE DAYOFWEEK(time)' +
      'WHEN \'1\' THEN \'일\' WHEN \'2\' THEN \'월\' WHEN \'3\' THEN \'화\' WHEN \'4\' THEN \'수\'\n' +
      'WHEN \'5\' THEN \'목\' WHEN \'6\' THEN \'금\' WHEN \'7\' THEN \'토\' END AS week from heart_table ' +
      'where test_number=999 ORDER BY time asc', function(err, rows) {
    var hrvList = [];
    var hrvPerList = [];
    var cnt = 0;
    var divide = 0;

    var date = new Date(rows[0].time);
    var str = String(date.getMonth() + 1) + '월 ' + String(date.getDate()) + '일 (' + rows[0].week + ')';
    hrvPerList.push(str);

    var sum = 0;
    var max = 0;

    for (var i=0; i<rows.length; i++) {
      if (date.getDate() === new Date(rows[i].time).getDate()) {
        sum += rows[i].avg_heart;
        max = Math.max(max, rows[i].max_heart);
        divide++;
      } else {
        sum /= divide;
        hrvPerList.push(max, sum);
        hrvList.push(hrvPerList);

        hrvPerList = [];
        date = new Date(rows[i].time);
        str = String(date.getMonth() + 1) + '월 ' + String(date.getDate()) + '일 (' + rows[i].week + ')';
        hrvPerList.push(str);
        cnt++;

        sum = rows[i].avg_heart;
        max = rows[i].max_heart;
        divide = 1;
      }
    }
    sum /= divide;
    hrvPerList.push(max, sum);
    hrvList.push(hrvPerList);

    hrvList.reverse();
    res.send(JSON.stringify(hrvList));
  });
});

// hrv list chart api
app.get('/hrv/five', (req, res) => {
  connection.query('SELECT time, avg_heart, max_heart from heart_table where test_number=999 ORDER BY time asc', function(err, rows) {
    if(err) throw err;

    var hrvList = [];
    var avgPer30 = new Array(48);
    var maxPer30 = new Array(48);
    var avgDivide = new Array(48);
    var cnt = 0;

    var date = new Date(rows[0].time);
    var check = 1;

    for (var i=0; i<rows.length; i+=6) {
      avgPer30[cnt] = 0;
      maxPer30[cnt] = 0;
      avgDivide[cnt] = 0;
      for (var j=0; j<6; j++) {
        if (i+j >= rows.length) {
          check = 0;
          break;
        }

        if (date.getDate() === new Date(rows[i+j].time).getDate()) {
          avgPer30[cnt] += rows[i+j].avg_heart;
          maxPer30[cnt] = Math.max(maxPer30[cnt], rows[i+j].max_heart);
          avgDivide[cnt]++;
        } else {
          avgPer30[cnt] /= avgDivide[cnt];
          maxPer30[cnt] = Math.max(maxPer30[cnt], rows[i+j].max_heart);
          // console.log(avgPer30, maxPer30);
          hrvList.push(avgPer30, maxPer30);

          date = new Date(rows[i+j].time);
          avgPer30 = new Array(48);
          maxPer30 = new Array(48);
          avgDivide = new Array(48);
          cnt = 0;

          avgPer30[cnt] = rows[i+j].avg_heart;
          maxPer30[cnt] = rows[i+j].max_heart;
          avgDivide[cnt] = 1;
        }
      }
      avgPer30[cnt] /= avgDivide[cnt];
      cnt++;

      if (check === 0) {
        break;
      }
    }
    // console.log(avgPer30, maxPer30);
    // avgPer30 /= divide;
    hrvList.push(avgPer30, maxPer30);

    hrvList.reverse();
    res.send(JSON.stringify(hrvList));
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