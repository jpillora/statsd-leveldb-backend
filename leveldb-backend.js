var level = require('level');

//==================
// leveldb interface
//==================

var db = level('./stats');
var MAX_SIZE = 1e10;

function sizeCheck() {
  //TODO another option is to store approximate size in the db itself...
  db.db.approximateSize('stat-0', 'stat-2', function (err, size) {
    if (err) return console.error('Ooops!', err);
    if (size > MAX_SIZE) console.log("Max size! TODO compression...");
    console.log('Stats are approximately using %d bytes', size);
  });
}

setInterval(sizeCheck, 20*1000);
sizeCheck();

var add = function(from, to, metrics) {
  var key = 'stat-'+from+':'+to,
      data = JSON.stringify(metrics);
  db.put(key, data, function(err) {
    if(err)
      console.error(err);
    else
      console.log('%s = %s...', key, data.substr(0, 60));
  });
};

//==================
//  statsd interface
//==================

var last, config;

//init provides us with an event emitter
exports.init = function(startupTime, initConfig, emitter) {
  last = Date.now();
  //retrieve config provided to us
  config = initConfig.console || {};
  //bind to statsd events
  emitter.on('flush', flush);
  emitter.on('status', status);
  //ready
  return true;
};

function flush(timestamp, metrics) {
  //replace timestamp
  timestamp = Date.now();
  add(last, timestamp, metrics);
  last = timestamp;
}

function status(write) {
  //write to non-error (null) to console backend
  write(null, 'console', 'lastFlush', lastFlush);
  write(null, 'console', 'lastException', lastException);
}
