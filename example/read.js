
var levelup = require('levelup');
var db = levelup('./statsd.db');

db.db.approximateSize('a', 'z', function (err, size) {
  if (err) return console.error('Ooops!', err)
  console.log('Approximate size of range is %d', size)
});

db.createReadStream()
  .on('data', function (data) {
    console.log(data.key, '=', data.value.substr(0,20) + "...")
  })
  .on('error', function (err) {
    console.log('Oh my!', err)
  })
  .on('close', function () {
    console.log('Stream closed')
  })
  .on('end', function () {
    console.log('Stream closed')
  })