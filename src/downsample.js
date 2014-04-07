var moment = require('moment');
var _ = require('lodash');

var util = require('./util');
var query = require('./query');
var traverse = require('./batchTraverse');

function skipBoundary(config) {
  return config.boundaries[0].boundary.asSeconds();
}

function pruneBoundary(config) {
  var count = config.boundaries.length;
  var prune = config.boundaries[count - 1];

  var limit = prune.boundary.asSeconds() / prune.interval.asSeconds();
  return {limit: limit, interval: prune.interval.asSeconds()};
}

module.exports = downsample =  function(opts, done) {
  var db = opts.db;
  var config = opts.config;
  var shouldTimeout = opts.shouldTimeout;

  var domain = {flushInterval: 0, batch: [], skipBoundary : 0, pruneLimit: 0};
  domain.skipBoundary = skipBoundary(config);
  domain.pruneBoundary = pruneBoundary(config);

  var start = moment();

  traverse(db,
    function(stats){

      console.log('For %s scanning took: %d ms', stats.name, stats.diff);

      var toPrune = _.filter(stats.batch, function(data) {
        var dur = util.durationFromKey(data.key, 'seconds');
        return dur === domain.pruneBoundary.interval;
      });

      if (!toPrune) toPrune = [];

      //First Prune
      var diff = toPrune.length - domain.pruneBoundary.limit;
      if (diff > 0 && toPrune.length >= domain.pruneBoundary.limit) {
        var toDel = [];

        var i = 0;
        while (i < diff) {
          var k = toPrune[i].key;
          var v = toPrune[i].value;
          toDel.push({type: 'del', key:k, value:v});
          i = i + 1;
        }

        db.batch(toDel, function(err) {
          if (err) return console.log(err);
          console.log('For %s, pruned %d records', stats.name, toDel.length);

          //Go through each boundaries
          stats.batch = _.difference(stats.batch, toDel);
          selectBoundary(db, config, domain, stats);
        });

      } else {
        selectBoundary(db, config, domain, stats);
      }

    },

    //End of traversal
    function() {
      var time = moment().diff(start, 'ms');
      console.log('Scanning & Compression took: %d secs', time);
      done();
    }
  );

  //Timeout
  if (shouldTimeout) {
    setTimeout(function(){ downsample(opts, done); }, config.checkInterval);
  }
};

var selectBoundary = function(db, config, domain, stats) {
  //Go through each boundaries
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

      _.forEach(stats.batch, function(data, index) {
          var duration = util.durationFromKey(data.key, 'seconds');
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
      var newBatch = compress(stats.name, domain.batch, timeframe);
      //Batch: Delete and Put
      db.batch(_.union(newBatch, domain.batch), function(err) {
        if (err) return console.log(err);
        var diff = moment().diff(cstart, 'ms');
        console.log('For %s, Compressed %d records. Took: %s ms', stats.name, domain.batch.length, diff);
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
