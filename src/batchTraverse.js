var moment = require('moment');
var util = require('./util');

module.exports = function(db, logic, end) {
  var statsNameChanged = true;
  var firsttime = true;
  var lastStatsName = "";

  var batch = [];
  var start = moment();
  var init = function() {
    batch = [];
    start = moment();
  };

  db.createReadStream()
    .on('data', function(data) {
      var statsname = util.statisticName(data.key);
      if (firsttime) {
        lastStatsName = statsname;
        firsttime = false;
      }

      statsNameChanged = lastStatsName !== statsname;
      if (statsNameChanged) {
        logic(makeScannedObject(lastStatsName, batch, start));
        init();
      }

      batch.push(data);
      lastStatsName = statsname;
    })
    .on('end', function(err) {
      if (batch.length > 0) {
        logic(makeScannedObject(lastStatsName, batch, start));
        init();
      }
      end();
    });
};

var makeScannedObject = function(statsname, batch, startTime) {
  var diff = moment().diff(startTime, 'milliseconds');
  return {name: statsname, batch: batch, diff:diff};
};
