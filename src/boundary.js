var _ = require('lodash');
var moment = require('moment');
var util = require('./util');
var query = require('./query');

module.exports = function(db, config, domain, batch) {
  //Go through each boundaries
  _.forEach(config.boundaries, function(boundary, index) {
    //skip the first boundary
    if (index === 0) {
      return;
    }

    domain.flushInterval = config.boundaries[index - 1].interval.asSeconds();
    var range = config.checkInterval.asSeconds();
    if (batch.length < range) {
      console.log('For %s not enough samples: %d', domain.prefix, batch.length);
      return;
    }

    _.forEach(batch, function(data, index) {
      var duration = util.durationFromKey(data.key, 'seconds');
      //Limit flooding of domain.batch
      if (duration === domain.flushInterval && domain.batch.length < range) {
        domain.batch.push({type: 'del', key: data.key, value: data.value});
      }
    });

    if (domain.batch.length < range) {
      // console.log('For %s not enough samples: %d', stats.name, domain.batch.length);
      domain.batch = [];
      return;
    }

    var cstart = moment();
    var timeframe = boundary.interval.asSeconds();
    var newBatch = compress(domain.prefix, domain.batch, timeframe);
    //Batch: Delete and Put
    db.batch(_.union(newBatch, domain.batch), function(err) {
      if (err) return console.log(err);
      var diff = moment().diff(cstart, 'ms');
      console.log('For %s, Compressed %d records. Took: %s ms', domain.prefix, domain.batch.length, diff);
      domain.batch = [];
    });

  });
};

var compress = function(statsname, batch, range) {
  var newBatch = [];

  var i=0;
  while (i < batch.length) {
    var dates = util.datesInKey(batch[i].key);
    var newKey = util.makeKeyFromDates(statsname, dates.from, moment(dates.from).add(range, 'seconds'));

    var statsBatch = [];
    for (var j = i; j < range; j++) {
      statsBatch.push(batch[j]);
    }

    var newValue = JSON.stringify(query.average(statsBatch));
    newBatch.push({type: 'put', key: newKey, value: newValue});

    i += range;
  }
  return newBatch;
};
