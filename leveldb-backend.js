var level = require('level')
var moment = require('moment')
var events = require('events')

//==================
// leveldb interface
//==================
var db = level('./stats');
var MAX_SIZE = 1e2;

function sizeCheck() {
  var m = moment()

  //create boundary
  var domain = {}
  var index = 0, lmt = 20
  db.createKeyStream({limit: lmt})
    .on('data', function(key) {

      //Check here if the this record is already compressed

      //Create delete batch in case the it needs to be deleted
      domain.delBatch = []
      domain.delBatch.push({type: 'del', key: key})

      //Save the boundaries
      if (index == 0) {
        domain.start = key
      }

      if (index >= lmt - 1) {
        domain.end = key

        //save the value for the end domain
        db.get(domain.end, function(err, data) {
          if (err) return console.log(err)
          domain.endValue = data
        })
      }

      index++;
    })
    .on('end', function() {

      try {
        db.db.approximateSize(domain.start, domain.end, function(err, size) {
          console.log("-------------------------------------------------")
          console.log("Size used by domain: [%s,%s]= %d", domain.start, domain.end, size)
          console.log("-------------------------------------------------")
          if (size > 2000) {
            console.log("#######Compression required######")
            var newKey = 'stat-' + domain.start.split('-')[1] + '-' + domain.end.split('-')[2]

            db.put(newKey, domain.endValue, function(err) {
              if (err) return console.log(err)

              //Success: execute delete batch
              db.batch(domain.delBatch, function(err) {
                if (err) return console.log(err)

                console.log("Successfully compressed. New key is: %s", newKey)
                console.log("-----------------------------------------")
              })

            })
          }
        })
      } catch (e) {
        console.log(e)
      }

    })
}

setInterval(sizeCheck, 100);

var add = function(from, to, metrics) {
  var key = 'stat-'+from+'-'+to,
      data = JSON.stringify(metrics);

  db.put(key, data, function(err) {
    if(err)
      console.error(err);
    else
      console.log('%s = %s...', key, JSON.stringify(metrics.gauges).substr(0, 60));
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
  timestamp = moment();
  add(last, timestamp, metrics);
  last = timestamp;
}

function status(write) {
  //write to non-error (null) to console backend
  write(null, 'console', 'lastFlush', lastFlush);
  write(null, 'console', 'lastException', lastException);
}
