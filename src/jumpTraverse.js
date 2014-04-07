var _ = require('lodash');
var moment = require('moment');

var util = require('./util');
var boundary = require('./boundary');

function skipBoundary(config) {
  return config.boundaries[0].boundary.asSeconds();
}

function pruneBoundary(config) {
  var count = config.boundaries.length;
  var prune = config.boundaries[count - 1];
  var limit = prune.boundary.asSeconds() / prune.interval.asSeconds();
  return {limit: limit, interval: prune.interval.asSeconds()};
}

module.exports = ds = function(opts, done) {
  var db = opts.db;
  var config = opts.config;
  var shouldTimeout = opts.shouldTimeout;

  var domain = {
    statsname: '',
    flushInterval: 0,
    skipBoundary : 0,
    batch: [],
  };
  domain.skipBoundary = skipBoundary(config);
  domain.pruneBoundary = pruneBoundary(config);

  var start = moment();

  eachPrefix(db, function(prefix) {
    var batch = [];

    db.createReadStream({start: prefix, limit: domain.skipBoundary})
      .on('data', function(data) {
        batch.push(data);
      })
      .on('end', function() {
        domain.prefix = prefix;
        boundary(db, config, domain, batch);
        console.log('Scanning %s took %d ms', prefix, moment().diff(start, 'ms'));
      });
  });

  //Timeout
  if (shouldTimeout) {
    setTimeout(function(){ ds(opts, done); }, config.checkInterval);
  }

};

var eachPrefix = function(db, onEach) {
  var prefixes = {};
  db.createReadStream({start: '/prefixes', limit:1})
    .on('data', function(key){
      prefixes = JSON.parse(key.value);
    })
    .on('end', function(){

      _.forIn(prefixes, function(value, prefix){
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

var startKey = function(db, next) {
  var firstKey;
  db.createKeyStream({limit: 1})
    .on('data', function(key) {
      firstKey = key;
    })
    .on('end', function(){
      next(firstKey);
    });
};

var endKey = function(db, startkey, skip, next) {
  var endKey;
  db.createKeyStream({start: jumpKey(startkey, skip), limit:1, reverse: true})
    .on('data', function(key){
      endKey = key;
    })
    .on('end', function(){
      next(endKey);
    });
};

var jumpKey = function(startkey, skipn) {
  var d = util.datesInKey(startkey);

  d.from.add(skipn, 'seconds');
  d.end = moment(d.to);

  return util.makeKeyFromDates(d.prefix, d.from, d.to);
};
