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
    item.points = item.boundary.asSeconds() / item.interval.asSeconds();
  });

  return c;
};

module.exports.datesInKey = function(key) {
  var k = key.split('-');
  return {from: moment(parseInt(k[1])), to: moment(parseInt(k[2]))};
};

function makeDuration(configItem) {
  var tmp = configItem.split(' ');
  return moment.duration(parseInt(tmp[0]), tmp[1]);
}
