var levelup = require('level');
var moment = require('moment');

var _ = require('lodash');
var util = require('./util');

//==================
// leveldb interface
//==================
var db = levelup('./db');
var keysCache = {};

//==================
//  statsd interface
//==================
var last, config;

//======================
//Exit Handler. Save DB Keys
//======================
var exitHandler = function() {
  if (_.isEmpty(keysCache)) return process.exit();

  db.get('0', function(err, data) {
    var keys = {};
    if (data) {
      keys = JSON.parse(data);
    }

    _.merge(keys, keysCache);

    db.put('0', JSON.stringify(keys), function(err){
      if (!err) {
        console.log('Saved keys');
      }
      process.exit();
    });
  });

};
process.on('exit', exitHandler);
process.on('SIGINT', exitHandler);

//init provides us with an event emitter
exports.init = function(startupTime, initConfig, emitter) {
  last = Date.now();

  //retrieve config provided to us
  config = util.initIntervals(initConfig) || {};

  //bind to statsd events
  emitter.on('flush', flush);
  emitter.on('status', status);

  // require('./downsample')({db: db, config: config, shouldTimeout: true}, function(){
  // });

  require('./jumpTraverse')({db: db, config: config, shouldTimeout: true});

  //ready
  return true;
};

function flush(timestamp, metrics) {
  //replace timestamp
  timestamp = moment();
  add(last, timestamp, metrics);
  last = timestamp;
}

function status(write) {
  //write to non-error (null) to console backend
  write(null, 'console', 'lastFlush', lastFlush);
  write(null, 'console', 'lastException', lastException);
}

var add = function(from, to, metrics) {
  var batch = [];
  _.forIn(metrics.gauges, function(value, key){

    if (key === 'statsd.timestamp_lag') return;

    var k = [key, from.valueOf(), to.valueOf()].join('-');
    keysCache[key] = true;

    batch.push({type: 'put', key:k, value:value});

    var diff = to.diff(from, 'seconds');
    console.log('%s = %s [%d secs]...', k, value, diff);
  });

  db.batch(batch, function(err) {
    if (err) console.log(err);
  });

  // var prop = _.findKey(metrics.gauges, function(value){
  //   return value !== 0;
  // });
  // var key = [prop, from.valueOf(), to.valueOf()].join('-'),
  //     data = JSON.stringify(metrics);
  // db.put(key, data, function(err) {
  //   if(err)
  //     console.error(err);
  //   else {
  //     //Save the propery in key cache
  //     keysCache[prop] = true;
  //     var diff = to.diff(from, 'seconds');
  //     console.log('%s = %s [Diff: %d secs]...', key, JSON.stringify(metrics.gauges).substr(0, 60), diff);
  //   }
  // });
};
