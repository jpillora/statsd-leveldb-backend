var level = require('level');

var db = level('./db');

var index = 0
var key = 'switch1'
console.log('For ' + key)
db.createReadStream({start: key})
  .on('data', function(data) {
    index = index + 1;
  })
  .on('end', function(){
    console.log('Count: ' + index);
  });


//
// var Worker = require('webworker-threads').Worker;
// // var w = new Worker('worker.js'); // Standard API
//
// var keys = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'];
//
// // You may also pass in a function:
// for (var k in keys) {
//   console.log('Spawing worker ' + k);
//
//   var fucker = function(){
//     onmessage = function(event) {
//       self.close();
//     };
//
//     var index = 0;
//     while (index < 1000000000) {
//       index++;
//     }
//     console.log(index);
//   }
//
//   var worker = new Worker(fucker);
//   worker.postMessage('ali');
// }
