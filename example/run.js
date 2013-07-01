
var fork = require('child_process').fork;
var sock = require('dgram').createSocket("udp4");

function start() {
  console.log("running statsd");
  var statsd = fork('../node_modules/statsd/stats.js', ['config.js'], {silent:true});
  statsd.stdout.pipe(process.stdout);
  statsd.stderr.pipe(process.stderr);
}

function send(data) {
  console.log("sending: ", data);

  var buff = new Buffer(data);
  sock.send(buff,0,buff.length,8125,'localhost', function(err, bytes) {
    if (err) throw err;
  });
}


var datas = [
  "bucket:1|c",
  "gaugor:333|g",
  "gaugor:-10|g",
  "gaugor:+4|g",
  "uniques:5|s"
];

function random() {
  var data = datas[Math.floor(Math.random()*datas.length)];
  send(data);
  setTimeout(random, 100);
}

start();
setTimeout(random, 500);

