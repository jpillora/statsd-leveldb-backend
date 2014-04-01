var moment = require('moment');
var _ = require('lodash');

var interval = require('./interval');
var query = require('./query');

module.exports = downsample =  function(opts, done) {
  var db = opts.db;
  var config = opts.config;
  var shouldTimeout = opts.shouldTimeout;

  _.forEach(config.boundaries, function(boundary, index) {
    //Skip the first boundary
    if (index === 0) return;

    var domain = {size: 0, batch: [], start: '', end: ''};
    domain.limit = config.boundaries[index - 1].points;

    domain.maxSize = config.maxSize;
    domain.boundarySize = {index: index + 1, size: config.boundaries.length};

    //get the first key
    db.createKeyStream({limit: 1})
      .on('data', function(key) {
        domain.start = key;
      })
      .on('end', function(err) {
        if (!domain.start) return;

        //Compute the jump key
        var dates = interval.datesInKey(domain.start);
        domain.start = interval.makeKeyFromDates(dates.from, dates.from.add(domain.limit, 'seconds'));
        //compute limit
        // domain.limit = boundary.points;
        domain.limit = config.checkInterval.asSeconds();

        selectBoundary(db, domain, boundary, done);
      });
  });

  //Timeout
  if (shouldTimeout) {
    setTimeout(function(){ downsample(opts, done); }, config.checkInterval);
  }
};

var selectBoundary = function(db, domain, boundary, done) {
  db.createReadStream({start: domain.start, limit:domain.limit})
    .on('data', function(data) {
      domain.batch.push({type: 'del', key: data.key, value: data.value});
      domain.size = domain.size + new Buffer(data.value).length;
      domain.end = data.key;
    })
    .on('end', function(err) {
      // if (domain.size < domain.maxSize) return done(domain.boundarySize);
      // if (domain.batch.length < boundary.points) return done(domain.boundarySize);

      var start = moment()
      var newBatch = compress(domain.batch, boundary.interval.asSeconds());
      console.log('Compression done: Took %d ms', moment().diff(start, 'ms'));

      //Batch: Delete and Put
      db.batch(_.union(newBatch, domain.batch), function(err) {
        if (err) return console.log(err);
        done(domain.boundarySize);
      });

    });
};

var compress = function(batch, range) {
  var newBatch = [];
  var i = 0;

  while (i < batch.length) {
    var dates = interval.datesInKey(batch[i].key);
    var newKey = interval.makeKeyFromDates(dates.from, moment(dates.from).add(range, 'seconds'));

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
