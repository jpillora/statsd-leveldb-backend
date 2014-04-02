var moment = require('moment');
var _ = require('lodash');

var util = require('./util');
var query = require('./query');

module.exports = downsample =  function(opts, done) {
  var db = opts.db;
  var config = opts.config;
  var shouldTimeout = opts.shouldTimeout;

  var statsNameChanged = true;
  var firsttime = true;
  var lastStatsName = "";

  utils.traverseDBInBatches(function(batch){
    console.log(batch)
  });

  _.forEach(config.boundaries, function(boundary, index) {
    //Skip the first boundary
    if (index === 0) return;

    var domain = {size: 0, batch: [], start: ''};
    domain.limit = config.boundaries[index - 1].points;
    domain.flushInterval = config.boundaries[index - 1].interval.asSeconds();

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
        var dates = util.datesInKey(domain.start);
        dates.to = moment(dates.from).add(domain.limit, 'seconds');
        domain.start = util.makeKeyFromDates('stat', dates.from, dates.to);

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

      var duration = util.durationFromKey(data.key, 'seconds')
      if (duration === domain.flushInterval) {
        domain.batch.push({type: 'del', key: data.key, value: data.value});
        domain.size = domain.size + new Buffer(data.value).length;
      }

    })
    .on('end', function(err) {
      // if (domain.size < domain.maxSize) return done(domain.boundarySize);
      // if (domain.batch.length < boundary.points) return done(domain.boundarySize);

      var start = moment();
      var newBatch = compress(domain.batch, boundary.interval.asSeconds());
      var time = moment().diff(start, 'ms')
      console.log('Took %d ms. Compressed %d records', time, domain.batch.length);

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
    var dates = util.datesInKey(batch[i].key);
    var newKey = util.makeKeyFromDates('stat', dates.from, moment(dates.from).add(range, 'seconds'));

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
