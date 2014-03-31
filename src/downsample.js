var moment = require('moment');
var query = require('./query');
var _ = require('lodash');

module.exports = downsample =  function(opts, done) {
  var db = opts.db;
  var config = opts.config;
  var shouldTimeout = opts.shouldTimeout;

  _.forEach(config.boundaries, function(boundary, index) {
    var domain = {size: 0, delBatch: [], start: '', end: ''};
    domain.limit = boundary.point;
    domain.maxSize = config.maxSize;
    domain.boundarySize = {index: index + 1, size: config.boundaries.length};

    //get the first key
    db.createKeyStream({limit: 1})
      .on('data', function(key) {
        domain.start = key;
      })
      .on('end', function(err) {
        if (!domain.start) return;
        compress(db, domain, boundary, done);
      });
  });

  //Timeout
  if (shouldTimeout) {
    setTimeout(function(){ downsample(opts, done); }, config.checkInterval);
  }
};

var durationFromKey = function(key, unit) {
  var k = key.split('-');
  var m1 = moment(parseInt(k[1]));
  var m2 = moment(parseInt(k[2]));
  // console.log('%s - %s', m1.format('YYYY-MM-DD hh:mm:ss'), m2.format('YYYY-MM-DD hh:mm:ss'))
  return m2.diff(m1, unit);
};

var compress = function(db, domain, boundary, done) {
  db.createReadStream({start: domain.start, limit:domain.limit})
    .on('data', function(data) {
      var dur = durationFromKey(data.key, 'seconds');

      if (dur === boundary.interval.asSeconds()) {
        //For uncompressed item, put them in the batch
        domain.delBatch.push({type: 'del', key: data.key, value: data.value});
        domain.size = domain.size + new Buffer(data.value).length;
        domain.end = data.key;
      }
    })
    .on('end', function(err) {
      if (domain.size < domain.maxSize) return done(domain.boundarySize);
      if (domain.delBatch.length < boundary.points) return done(domain.boundarySize);

      batchDelete(db, domain, boundary, done);
    });
};

var batchDelete = function(db, domain, boundary, done) {
  console.log('Compressing %d data points for boundary - %d s', boundary.points, boundary.interval.asSeconds());
  var start = moment();
  //Construct new key
  var newKey = 'stat-' + domain.start.split('-')[1] + '-' + domain.end.split('-')[2];
  var newValue = JSON.stringify(query.average(domain.delBatch));
  db.put(newKey, newValue, function(err) {
    if (err) return console.log(err);
    //Execute delete batch
    db.batch(domain.delBatch, function(err) {
      if (err) return console.log(err);
      console.log('Compression Done. Took: %d ms', moment().diff(start, 'ms'));
      //end of compression function
      if (done) {
        done(domain.boundarySize);
      }
    });
  });
};
