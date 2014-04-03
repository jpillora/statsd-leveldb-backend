var _ = require('lodash');
var moment = require('moment');

exports.initIntervals = function(config) {
  var c = _.extend(config);

  c.checkInterval = makeDuration(config.checkInterval);
  c.boundaries.forEach(function(item) {
    item.boundary = makeDuration(item.boundary);
    item.interval = makeDuration(item.interval);
    item.points = item.boundary.asSeconds();
  });

  return c;
};

exports.datesInKey = function(key) {
  var k = key.split('-');
  return {from: moment(parseInt(k[1])), to: moment(parseInt(k[2]))};
};

exports.makeKeyFromDates = function(prefix, from, to) {
  return [prefix, from.valueOf(), to.valueOf()].join('-');
};

exports.durationFromKey = function(key, unit) {
  var k = key.split('-');
  var m1 = moment(parseInt(k[1]));
  var m2 = moment(parseInt(k[2]));
  // console.log('%s - %s', m1.format('YYYY-MM-DD hh:mm:ss'), m2.format('YYYY-MM-DD hh:mm:ss'))
  return m2.diff(m1, unit);
};

exports.statisticName = function(key) {
  return key.split('-')[0];
};

exports.traverseDBInBatches = function(db, logic, end) {
  var statsNameChanged = true;
  var firsttime = true;
  var lastStatsName = "";

  var batch = [];
  db.createReadStream()
    .on('data', function(data) {

      var statsname = exports.statisticName(data.key);
      if (firsttime) {
        lastStatsName = statsname;
        firsttime = false;
      }

      statsNameChanged = lastStatsName !== statsname;
      if (statsNameChanged) {
        logic({name: lastStatsName, batch: _.cloneDeep(batch)});
        batch = [];
      }

      batch.push(data);

      lastStatsName = statsname;
    })
    .on('end', function(err) {
      
      if (batch.length > 0) {
        logic({name: lastStatsName, batch: _.cloneDeep(batch)});
      }

      end()
    });
};

exports.diffInDates = function(key) {
  dates = exports.datesInKey(key)
  from = dates.from.format('YYYY-MM-DD hh:mm:ss')
  to = dates.to.format('YYYY-MM-DD hh:mm:ss')
  diff = dates.to.diff(dates.from, 'seconds')
  return {from: from, to: to , diff: diff}
};

function makeDuration(configItem) {
  var tmp = configItem.split(' ');
  return moment.duration(parseInt(tmp[0]), tmp[1]);
}
