
var fork = require('child_process').fork;
var sock = require('dgram').createSocket("udp4");

function start() {
  console.log("running statsd");
  fork('../node_modules/statsd/stats.js', ['config.js'], {stdio:'inherit'});
}

function send(data) {
  // console.log("sending: ", data);
  var buff = new Buffer(data);
  sock.send(buff,0,buff.length,8125,'localhost', function(err, bytes) {
    if (err) throw err;
  });
}


var datas = [
  "bucket:{{2:8}}|c",
  "gaugor:{{1:5}}|g",
  "gaugor:-{{1:10}}|g",
  "gaugor:+{{1:10}}|g",
  "uniques:{{-10:10}}|s"
];

function randomInt(max) {
  return Math.floor(Math.random()*max);
}

function random() {
  var data = datas[randomInt(datas.length)];
  data = data.replace(/\{\{(.+):(.+)\}\}/, function(o, from, to) {
    from = parseInt(from, 10);
    to = parseInt(to, 10);
    return randomInt(to-from)+from;
  });
  // console.log(data);
  send(data);
  setTimeout(random, 10+randomInt(10));
}

start();
setTimeout(random, 500);

