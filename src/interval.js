var _ = require('lodash');
var moment = require('moment');

module.exports = function(config) {
  var c = _.extend(config);

  if (c.checkInterval) {
    c.checkInterval = makeDuration(config.checkInterval);
  } else {
    c.checkInterval = moment.duration(10, 'seconds');
    console.log('No check interval defined in config. Defaulting to 10 seconds');
  }

  c.boundaries.forEach(function(item) {
    item.boundary = makeDuration(item.boundary);
    item.interval = makeDuration(item.interval);
    item.points = item.boundary.asSeconds();
  });

  return c;
};

module.exports.datesInKey = function(key) {
  var k = key.split('-');
  return {from: moment(parseInt(k[1])), to: moment(parseInt(k[2]))};
};

module.exports.makeKeyFromDates = function(from, to) {
  return 'stat-' + from.valueOf() + '-' + to.valueOf();
};

module.exports.durationFromKey = function(key, unit) {
  var k = key.split('-');
  var m1 = moment(parseInt(k[1]));
  var m2 = moment(parseInt(k[2]));
  // console.log('%s - %s', m1.format('YYYY-MM-DD hh:mm:ss'), m2.format('YYYY-MM-DD hh:mm:ss'))
  return m2.diff(m1, unit);
};

function makeDuration(configItem) {
  var tmp = configItem.split(' ');
  return moment.duration(parseInt(tmp[0]), tmp[1]);
}
