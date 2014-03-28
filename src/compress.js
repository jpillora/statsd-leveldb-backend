var moment = require('moment');

var query = require('./query');

var durationFromKey = function(key, unit) {
  var k = key.split('-');
  var m1 = moment(parseInt(k[1]));
  var m2 = moment(parseInt(k[2]));
  // console.log('%s - %s', m1.format('YYYY-MM-DD hh:mm:ss'), m2.format('YYYY-MM-DD hh:mm:ss'))
  return m2.diff(m1, unit);
};

module.exports = compress =  function(opts, compressionDone) {
  //create boundary
  var domain = {size: 0, delBatch: [], start: '', end: ''};
  var index = 0;

  var db = opts.db;
  var config = opts.config;
  var shouldTimeout = opts.shouldTimeout;

  var limit = config.limit

  db.createReadStream({limit: limit})
    .on('data', function(data) {

      var dur = durationFromKey(data.key, 'seconds');
      if (dur == 1) {
        //For uncompressed item, put them in the batch
        domain.delBatch.push({type: 'del', key: data.key, value: data.value});
      }

      //Save the boundaries
      if (index === 0) {
        domain.start = data.key;
      }

      if (index >= limit - 1) {
        domain.end = data.key;
      }

      domain.size = domain.size + new Buffer(data.value).length;
      index++;
    })

    .on('end', function() {
      if (domain.size < config.maxSize) {
        return;
      }

      console.log('Compressing...');
      var start = moment();

      //Construct new key
      var newKey = 'stat_cmp-' + domain.start.split('-')[1] + '-' + domain.end.split('-')[2];
      var newValue = JSON.stringify(query.average(domain.delBatch));
      db.put(newKey, newValue, function(err) {
        if (err) return console.log(err);
        //Execute delete batch
        db.batch(domain.delBatch, function(err) {
          if (err) return console.log(err);
          console.log('Compression Done. Took: %d ms', moment().diff(start, 'ms'));
          //end of compression function
          if (compressionDone) {
            compressionDone();
          }
        });
      });
    }); //End of read stream

    if (shouldTimeout) {
      setTimeout(function(){ compress(opts, compressionDone); }, config.checkInterval);
    }
};
