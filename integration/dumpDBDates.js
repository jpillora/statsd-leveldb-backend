var level = require('level');
var moment = require('moment');

var util = require('../src/util');
var traverse = require('../src/jumpTraverse');

var db = level('db');

util.printDB(db, function() {
  console.log('End');
});
