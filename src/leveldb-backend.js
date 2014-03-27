var level = require('level')
var moment = require('moment')

var interval = require('./interval')

//==================
// leveldb interface
//==================
var db = level('./db');

//==================
//  statsd interface
//==================
var last, config;

//init provides us with an event emitter
exports.init = function(startupTime, initConfig, emitter) {
  last = Date.now();

  //retrieve config provided to us
  config = interval(initConfig) || {};

  //bind to statsd events
  emitter.on('flush', flush);
  emitter.on('status', status);

  require('./compress')({db: db, config: config, shouldTimeout: true})

  //ready
  return true;
};

function flush(timestamp, metrics) {
  //replace timestamp
  timestamp = moment();
  add(last, timestamp, metrics);
  last = timestamp;
};

function status(write) {
  //write to non-error (null) to console backend
  write(null, 'console', 'lastFlush', lastFlush);
  write(null, 'console', 'lastException', lastException);
};

var add = function(from, to, metrics) {
  var key = 'stat-'+from+'-'+to,
      data = JSON.stringify(metrics);

  db.put(key, data, function(err) {
    if(err)
      console.error(err);
    else {
      var diff = to.diff(from, 'seconds')
      console.log('%s = %s [Diff: %d secs]...', key, JSON.stringify(metrics.gauges).substr(0, 60), diff);
    }
  });
};
