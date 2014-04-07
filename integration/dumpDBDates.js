var level = require('level');
var moment = require('moment');

var util = require('../src/util');
var traverse = require('../src/jumpTraverse');

var db = level('db');

traverse(db, 60, function() {
  console.log('done');
});

var index = 0;

// db.createReadStream({start: 'switch2.cpu', limit: 60})
//   .on('data', function(data) {
//     util.printKey(data.key);
//     index = index + 1;
//   })
//   .on('end', function() {
//     console.log('Count: ' + index);
//   });

// util.printDB(db, function() {
//   console.log('End');
// });
