/*jshint node:true, laxcomma:true */

var util = require('util');
var levelup = require('levelup');

//==================
// leveldb interface
//==================

var db = levelup('./statsd.db');
var maximumSize = 1e10;
var entriesSize = 0;

function sizeCheck() {
  db.db.approximateSize('a', 'z', function (err, size) {
    if (err) return console.error('Ooops!', err);
    entriesSize = size;
    console.log('Approximate size of range is %d', size);
  });
}

setInterval(sizeCheck, 20*1000);
sizeCheck();

var add = function(from, to, metrics) {
  var key = 'data-'+from+':'+to,
      data = JSON.stringify(metrics);
  db.put(key, data, function(err) {
    console.log(err || 'put: ' + key);
  });
};


//==================
//  statsd interface
//==================

var last, config;

exports.init = function(startupTime, initConfig, emitter) {

  last = now();
  config = initConfig.console || {};

  emitter.on('flush', flush);
  emitter.on('status', status);

  return true;
};

function flush(timestamp, metrics) {
  //replace timestamp
  timestamp = now();
  add(last, timestamp, metrics);
  last = timestamp;
}

function status(write) {
  write(null, 'console', 'lastFlush', lastFlush);
  write(null, 'console', 'lastException', lastException);
}

//==================
//  helpers
//==================

function map(obj, fn) {
  var arr = [];
  for(var key in obj)
    arr.push(fn(key, obj[key]));
  return arr;
}

function now() {
  return new Date().getTime();
}