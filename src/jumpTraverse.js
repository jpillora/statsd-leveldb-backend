var _ = require('lodash');
var util = require('./util');
var moment = require('moment');

module.exports = function(db, skip, done) {

  eachPrefix(db, function(prefix) {

    var batch = [];
    db.createReadStream({start: prefix, limit: skip})
      .on('data', function(data) {
        batch.push(data);
      })
      .on('end', function() {

        _.forEach(batch, function(item) {
          util.printKey(item.key);
        });

      });

  }, done);

  // startKey(db, function(start) {
  //   endKey(db, start, skip, function(end) {
  //     traverse(db, start, end);
  //   });
  // });

};

var eachPrefix = function(db, onEach, done) {
  var prefixes = {};
  db.createReadStream({start: '/prefixes', limit:1})
    .on('data', function(key){
      prefixes = JSON.parse(key.value);
    })
    .on('end', function(){

      _.forIn(prefixes, function(value, key){
        onEach(key);
      });

      done();
    });
};

var traverse = function(db, start, end) {
  var statsname;
  var batch = [];

  db.createReadStream({start: start, end: end})
    .on('data', function(data) {
      statsname = util.statisticName(data.key);
      util.printDate(data.key);
    })
    .on('end', function() {
      console.log('That was for %s', statsname);
    });
};

var startKey = function(db, next) {
  var firstKey;
  db.createKeyStream({limit: 1})
    .on('data', function(key) {
      firstKey = key;
    })
    .on('end', function(){
      next(firstKey);
    });
};

var endKey = function(db, startkey, skip, next) {
  var endKey;
  db.createKeyStream({start: jumpKey(startkey, skip), limit:1, reverse: true})
    .on('data', function(key){
      endKey = key;
    })
    .on('end', function(){
      next(endKey);
    });
};

var jumpKey = function(startkey, skipn) {
  var d = util.datesInKey(startkey);

  d.from.add(skipn, 'seconds');
  d.end = moment(d.to);

  return util.makeKeyFromDates(d.prefix, d.from, d.to);
};
