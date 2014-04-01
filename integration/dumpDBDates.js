var level = require('level');
var moment = require('moment');
var interval = require('../src/interval');

var db = level('db');

db.createKeyStream()
  .on('data', function(key) {

    var dates = interval.datesInKey(key);

    var from = dates.from.format('YYYY-MM-DD hh:mm:ss');
    var to = dates.to.format('YYYY-MM-DD hh:mm:ss');
    var diff = dates.to.diff(dates.from, 'seconds');

    console.log('[%s - %s] - Diff: %d secs', from, to, diff);
  })
  .on('end', function(err) {
  });
