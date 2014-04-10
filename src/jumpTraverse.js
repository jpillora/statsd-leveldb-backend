var _ = require('lodash');
var moment = require('moment');

var util = require('./util');
var query = require('./query');

var fs = require('fs');

function skipBndry(config) {
  return config.boundaries[0].boundary.asSeconds();
}

function pruneBndry(config) {
  var count = config.boundaries.length;
  var prune = config.boundaries[count - 1];
  var limit = prune.boundary.asSeconds() / prune.interval.asSeconds();
  return {limit: limit, interval: prune.interval.asSeconds()};
}

module.exports = ds = function(opts, done) {
  var db = opts.db;
  var config = opts.config;
  var shouldTimeout = opts.shouldTimeout;

  var domain = {};
  domain.skipBndry = skipBndry(config);
  domain.pruneBndry = pruneBndry(config);
  domain.range = config.checkInterval.asSeconds();

  var index = 1;

  eachPrefix(db, function(prefix) {
    var batch = [];
    var bndry = config.boundaries[index - 1];
    var flushInterval = bndry.interval.asSeconds();
    console.time('Scan:' + prefix);

    db.createReadStream({start:prefix+'\xff', end:prefix, limit:domain.range, reverse: true})
      .on('data', function(data) {
        var duration = util.durationFromKey(data.key, 'seconds');
        if (duration === flushInterval) {
          batch.push({type: 'del', key: data.key, value: data.value});
        }
      })
      .on('end', function() {
        console.timeEnd('Scan:' + prefix);
        if (batch.length < domain.range) {
          // console.log('For %s not enough samples: %d', prefix, batch.length);
          batch = [];
          return;
        }

        console.time('Compress:' + prefix);
        var timeframe = bndry.interval.asSeconds();
        var newBatch = compress(batch, timeframe);
        db.batch(_.union(newBatch, batch), function(err) {
          if (err) return console.log(err);
          console.timeEnd('Compress:' + prefix);
          console.log('Compressed %d records.', batch.length);
          batch = [];
        });
      });

  });

  //Timeout
  if (shouldTimeout) {
    setTimeout(function(){ ds(opts, done); }, config.checkInterval);
  }
};

var compress = function(batch, timeframe) {
  var newBatch = [];

  var len = batch.length;

  var d0 = util.datesInKey(batch[len - 1].key);
  var d1 = util.datesInKey(batch[0].key);

  var estimate = moment(d0.from).add(timeframe, 'seconds');

  console.log(moment(estimate).format('YYYY-MM-DD hh:mm:ss'));

  var j = 0;
  while (j < batch.length) {
    var d = util.datesInKey(batch[j].key);
    var diff = d.from.diff(estimate, 'seconds');
    if (diff == timeframe) {
    }
    j = j + 1;
  }

  // var newKey = util.makeKeyFromDates(d0.prefix, d0.from, moment(d0.from).add(timeframe, 'seconds'));
  var newKey = util.makeKeyFromDates(d0.prefix, d0.from, d1.to);

  var newValue = JSON.stringify(query.average(batch));
  newBatch.push({type: 'put', key: newKey, value: newValue});

  return newBatch;
};

var eachPrefix = function(db, onEach) {
  var prefixes = {};
  db.createValueStream({start: '0', limit:1})
    .on('data', function(value){
      prefixes = JSON.parse(value);
    })
    .on('end', function(){

      _.forIn(prefixes, function(value, prefix) {
        onEach(prefix);
      });

    });
};

var traverse = function(db, start, end) {
  var statsname;
  var batch = [];

  db.createReadStream({start: start, end: end})
    .on('data', function(data) {
      statsname = util.statisticName(data.key);
      util.printDate(data.key);
    })
    .on('end', function() {
      console.log('That was for %s', statsname);
    });
};

module.exports.compress = compress;
