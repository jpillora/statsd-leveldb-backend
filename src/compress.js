var moment = require('moment')

durationFromKey = function(key, unit) {
  var k = key.split('-')
  var m1 = moment(parseInt(k[1]))
  var m2 = moment(parseInt(k[2]))
  // console.log('%s - %s', m1.format('YYYY-MM-DD hh:mm:ss'), m2.format('YYYY-MM-DD hh:mm:ss'))
  return m2.diff(m1, unit)
};

module.exports = compress =  function(opts) {
  //create boundary
  var domain = {}
  var index = 0, lmt = 200

  //Create delete batch in case the it needs to be deleted
  domain.delBatch = []

  var db = opts.db
  var config = opts.config
  var shouldTimeout = opts.shouldTimeout

  db.createKeyStream({limit: lmt})
    .on('data', function(key) {

      var dur = durationFromKey(key, 'seconds')
      if (dur == 1) {
        //For uncompressed item, put them in the batch
        domain.delBatch.push({type: 'del', key: key})
      }

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
          if (size > config.maxSize) {
            console.log("#######Compression required######")
            var newKey = 'stat_compressed-' + domain.start.split('-')[1] + '-' + domain.end.split('-')[2]

            db.put(newKey, domain.endValue, function(err) {
              if (err) return console.log(err)

              console.log(domain.delBatch)

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

    if (shouldTimeout) {
      setTimeout(function(){ compress(db, config) }, config.checkInterval)
    }

}
