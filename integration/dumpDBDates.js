var level = require('level');
var moment = require('moment');
var util = require('../src/util');

var db = level('db');

util.traverseDBInBatches(db, function(stats) {
  console.log('%s, %d', stats.name, stats.batch.length);

  stats.batch.forEach(function(data) {
    var dates = util.datesInKey(data.key);
    var from = dates.from.format('YYYY-MM-DD hh:mm:ss');
    var to = dates.to.format('YYYY-MM-DD hh:mm:ss');
    var diff = dates.to.diff(dates.from, 'seconds');

    console.log('[%s - %s] - Diff: %d secs', from, to, diff);
  });

},
function() {
  console.log('End');
}
);
