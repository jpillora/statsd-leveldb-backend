var _ = require('lodash');
var moment = require('moment');

var util = require('./util');
var query = require('./query');
var boundary = require('./boundary');

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

  var domain = {}
  domain.skipBndry = skipBndry(config);
  domain.pruneBndry = pruneBndry(config);
  domain.range = config.checkInterval.asSeconds();
  domain.startBndry = 1

  eachPrefix(db, function(prefix) {
    eachBoundary(config.boundaries, domain.startBndry, function(bndry, index) {

      var batch = [];
      var flushInterval = config.boundaries[index - 1].interval.asSeconds();
      var pstart = moment();
      console.time('Scan:' + prefix)

      db.createReadStream({end: prefix, limit: domain.range, reverse: true})
        .on('data', function(data) {
          var duration = util.durationFromKey(data.key, 'seconds');
          //Limit flooding of domain.batch
          if (duration === flushInterval && batch.length < domain.range) {
            batch.push({type: 'del', key: data.key, value: data.value});
          }
        })
        .on('end', function() {
          console.timeEnd('Scan:' + prefix);
          if (batch.length < domain.range) {
            console.log('For %s not enough samples: %d', prefix, batch.length);
            batch = [];
            return;
          }

          console.time('Compress:' + prefix);
          var timeframe = bndry.interval.asSeconds();
          var newBatch = compress(batch, timeframe);
          //Batch: Delete and Put
          db.batch(_.union(newBatch, batch), function(err) {
            if (err) return console.log(err);
            console.timeEnd('Compress:' + prefix);
            console.log('Compressed %d records.', batch.length);
            batch = [];
          });

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

  var d = util.datesInKey(batch[len - 1].key);
  var newKey = util.makeKeyFromDates(d.prefix, d.from, moment(d.from).add(timeframe, 'seconds'));

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
      })
    });
};

var eachBoundary = function(boundaries, startFrom, onEach) {
  _.forEach(boundaries, function(boundary, index) {
    if (index === startFrom) {
      onEach(boundary, index);
    }
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
