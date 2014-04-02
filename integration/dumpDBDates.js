var level = require('level');
var moment = require('moment');
var util = require('../src/util');

var db = level('db');

var statsNameChanged = true
var firsttime = true
var lastStatsName = ""

util.traverseDBInBatches(db, function(stats) {
  console.log('%s, %d', stats.name, stats.batch.length);

  stats.batch.forEach(function(data) {

    var dates = util.datesInKey(data.key);
    var from = dates.from.format('YYYY-MM-DD hh:mm:ss');
    var to = dates.to.format('YYYY-MM-DD hh:mm:ss');
    var diff = dates.to.diff(dates.from, 'seconds');

    console.log('[%s - %s] - Diff: %d secs', from, to, diff);

  });

});

// db.createKeyStream()
//   .on('data', function(key) {
//
//     var statsname = util.statisticName(key);
//     if (firsttime) {
//       lastStatsName = statsname;
//     }
//
//     statsNameChanged = lastStatsName !== statsname;
//
//     if (statsNameChanged || firsttime) {
//       console.log('For %s', statsname);
//       firsttime = false
//     }
//
//     lastStatsName = statsname;
//
//     var dates = util.datesInKey(key);
//     var from = dates.from.format('YYYY-MM-DD hh:mm:ss');
//     var to = dates.to.format('YYYY-MM-DD hh:mm:ss');
//     var diff = dates.to.diff(dates.from, 'seconds');
//
//     console.log('[%s - %s] - Diff: %d secs', from, to, diff);
//
//     lastStatsName = statsname;
//   })
//   .on('end', function(err) {
//   });
