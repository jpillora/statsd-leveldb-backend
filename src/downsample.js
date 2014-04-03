var moment = require('moment');
var _ = require('lodash');

var util = require('./util');
var query = require('./query');

module.exports = downsample =  function(opts, done) {
  var db = opts.db;
  var config = opts.config;
  var shouldTimeout = opts.shouldTimeout;

  var statsNameChanged = true;
  var firsttime = true;
  var lastStatsName = "";

  var domain = {flushInterval: 0, batch: []}

  util.traverseDBInBatches(db, function(stats){

    var start = moment();
    _.forEach(config.boundaries, function(boundary, index) {
      //skip the first boundary
      if (index === 0) {
        return;
      }

      domain.flushInterval = config.boundaries[index - 1].interval.asSeconds();
      var range = config.checkInterval.asSeconds();
      if (stats.batch.length < range) {
        console.log('For %s not enough samples: %d', stats.name, domain.batch.length);
        return;
      }

      _.forEach(stats.batch, function(data) {
        var duration = util.durationFromKey(data.key, 'seconds');
        if (duration === domain.flushInterval) {
          domain.batch.push({type: 'del', key: data.key, value: data.value});
        }
      });

      if (domain.batch.lengh < range) {
        console.log('For %s not enough samples: %d', stats.name, domain.batch.length);
        return;
      }

      var timeframe = boundary.interval.asSeconds();
      var newBatch = compress(domain.batch, timeframe);
      //Batch: Delete and Put
      db.batch(_.union(newBatch, domain.batch), function(err) {
        if (err) return console.log(err);
        var time = moment().diff(start, 'ms');
        console.log('For %s Took %d ms. Compressed %d records', stats.name , time, domain.batch.length);
      });
    });
  },
  function() {
    console.log('End reached');
    done();
  }
  );

  //Timeout
  if (shouldTimeout) {
    setTimeout(function(){ downsample(opts, done); }, config.checkInterval);
  }
};

var compress = function(batch, range) {
  var newBatch = [];
  var i = 0;

  while (i < batch.length) {
    var dates = util.datesInKey(batch[i].key);
    var statsname = util.statisticName(batch[i].key);
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
