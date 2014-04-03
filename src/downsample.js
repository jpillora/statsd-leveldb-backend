var moment = require('moment');
var _ = require('lodash');

var util = require('./util');
var query = require('./query');

module.exports = downsample =  function(opts, done) {
  var db = opts.db;
  var config = opts.config;
  var shouldTimeout = opts.shouldTimeout;

  var domain = {flushInterval: 0, batch: [], skipBoundary : 0, pruneLimit: 0};

  domain.skipBoundary = config.boundaries[0].boundary.asSeconds();
  var boundaryCount = config.boundaries.length;
  domain.pruneLimit = config.boundaries[boundaryCount - 1].boundary.asSeconds();

  var start = moment();

  util.traverseDBInBatches(db,
    function(stats){

      //First Prune
      var diff = stats.batch.length - domain.pruneLimit;
      if (stats.batch.length >= domain.pruneLimit && diff > 0) {
        var toDel = [];

        var i = 0;
        while (i < diff) {
          var k = stats.batch[i].key;
          var v = stats.batch[i].value;
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
      console.log('Scanning took: %d secs', time);
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
          if (duration === domain.flushInterval) {
            domain.batch.push({type: 'del', key: data.key, value: data.value});
          }
      });

      if (domain.batch.length < range) {
        // console.log('For %s not enough samples: %d', stats.name, domain.batch.length);
        domain.batch = [];
        return;
      }

      var timeframe = boundary.interval.asSeconds();
      var newBatch = compress(stats.name, domain.batch, timeframe);
      //Batch: Delete and Put
      db.batch(_.union(newBatch, domain.batch), function(err) {
        if (err) return console.log(err);
        console.log('For %s, Compressed %d records', stats.name, domain.batch.length);
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
