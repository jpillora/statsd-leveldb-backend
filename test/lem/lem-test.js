var lem = require('lem');
var through = require('through');

var level = require('level');

var db = level('./db');

var lemdb = lem(db);

var keys = ['switch1.cpu', 'switch2.cpu', 'switch3.cpu'];
var recorders = [];

lemdb.on('index', function(key, meta) {
  // console.log('triggered for ' + key);
});

for (var i in keys) {
  var key = keys[i];
  var recorder = lemdb.recorder(key);
  lemdb.index(key, 'My Key', function() {
  });
  recorders.push(recorder);
}

setInterval(function() {
  console.log('tick tock');
  var r = recorders[Math.floor(Math.random() * (recorders.length - 0) + 0)];
  r(Math.random() * 100);
},
1000);
