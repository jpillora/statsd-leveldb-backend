var _ = require('lodash');
var moment = require('moment');

var initIntervals = function(config) {
  var c = _.extend(config);

  c.checkInterval = makeDuration(config.checkInterval);
  c.boundaries.forEach(function(item) {
    item.boundary = makeDuration(item.boundary);
    item.interval = makeDuration(item.interval);
    item.points = item.boundary.asSeconds();
  });

  return c;
};

var datesInKey = function(key) {
  var k = key.split('-');
  var from  = moment(parseInt(k[1]));
  var to = moment(parseInt(k[2]));
  return {prefix: k[0], from: from, to: to};
};

var diffInDates = function(key) {
  var dates = datesInKey(key);
  var from = dates.from.format('YYYY-MM-DD hh:mm:ss');
  var to = dates.to.format('YYYY-MM-DD hh:mm:ss');
  var diff = dates.to.diff(dates.from, 'seconds');
  return {prefix:dates.prefix, from: from, to: to , diff: diff};
};

var makeKeyFromDates = function(prefix, from, to) {
  return [prefix, from.valueOf(), to.valueOf()].join('-');
};

var durationFromKey = function(key, unit) {
  var k = key.split('-');
  var m1 = moment(parseInt(k[1]));
  var m2 = moment(parseInt(k[2]));
  // console.log('%s - %s', m1.format('YYYY-MM-DD hh:mm:ss'), m2.format('YYYY-MM-DD hh:mm:ss'))
  return m2.diff(m1, unit);
};

var statisticName = function(key) {
  return key.split('-')[0];
};

function makeDuration(configItem) {
  var tmp = configItem.split(' ');
  return moment.duration(parseInt(tmp[0]), tmp[1]);
}

var printDB = function(db, next) {
  require('./batchTraverse')(db, function(stats) {

    // console.log('%s, %d', stats.name, stats.batch.length);
    stats.batch.forEach(function(data) {
      printKey(data.key);
    });

  },
  function() {
    next();
  });
};

var printKey = function(key) {
  var d = diffInDates(key);
  console.log('%s - [%s - %s] - Diff: %d secs', d.prefix, d.from, d.to, d.diff);
};

exports.initIntervals = initIntervals;
exports.datesInKey = datesInKey;
exports.makeKeyFromDates = makeKeyFromDates;
exports.durationFromKey = durationFromKey;
exports.statisticName = statisticName;
exports.diffInDates = diffInDates;
exports.printDB = printDB;
exports.printKey = printKey;
