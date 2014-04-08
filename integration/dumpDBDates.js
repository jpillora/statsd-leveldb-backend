var level = require('level');
var moment = require('moment');

var util = require('../src/util');
var traverse = require('../src/jumpTraverse');

var db = level('db');

// db.createReadStream({start: 'switch1.cpu', limit: 10})
//   .on('data', function(data) {
//     util.printKey(data.key);
//   })
//   .on('end', function() {
//   });

util.printDB(db, function() {
  console.log('End');
});
