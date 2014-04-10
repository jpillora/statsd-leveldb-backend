var level = require('level');
var moment = require('moment');

var util = require('../src/util');
var traverse = require('../src/jumpTraverse');

var db = level('db');

var key = 'switch1.cpu';

var batch = [];

db.createReadStream({start: key+'\xff', end:key, limit:30, reverse:true})
  .on('data', function(data) {
    util.printKey(data.key);
    batch.push({type: 'del', key: data.key, value: data.value});
  })
  .on('end', function() {

    console.log('Compressed');
    var newBatch = traverse.compress(batch, 10);
    util.printKey(newBatch[0].key);

  });

// util.printDB(db, function() {
//   console.log('End');
// });
