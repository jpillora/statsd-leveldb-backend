var _ = require('lodash');

exports.accumulate = function(records) {
  if (records.length === 0) return {};

  var counter = _.cloneDeep(JSON.parse(records[0].value));

  //Reset all the properties in the counter to zero
  _.forOwn(counter.gauges, function(value, property) {
    counter.gauges[property] = 0;
  });

  _(records).forEach(function(item) {
    if (!item) return;

    var a = JSON.parse(item.value);
    //Accumulate values of all the property
    _.forOwn(a.gauges, function(value, property){
      counter.gauges[property] += value;
    });
  });

  return counter;
};

exports.average = function(records) {
  var counter = exports.accumulate(records);
  _.forOwn(counter.gauges, function(value, property) {
    counter.gauges[property] /= records.length;
  });
  return counter;
};

exports.percentile = function(records) {
};
