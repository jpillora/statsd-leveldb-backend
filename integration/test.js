var fork = require('child_process').fork;
var sock = require('dgram').createSocket("udp4");

function start() {
  console.log("running statsd");
  fork('../node_modules/statsd/stats.js', ['config.js'], {stdio:'inherit'});
}

function send(data) {
  var buff = new Buffer(data);
  sock.send(buff,0,buff.length,8125,'localhost', function(err, bytes) {
    if (err) throw err;
  });
}

var datas = [
  "switch1.cpu:{{0:100}}|g",
  "switch2.cpu:{{0:100}}|g",
  "switch1.port12.rxBytes:{{100:500}}|g",
  "switch1.port14.rxBytes:{{100:500}}|g",
  "switch2.port42.rxBytes:{{100:500}}|g"
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

  send(data);
  setTimeout(random, 1000);
}

start();
setTimeout(random, 1000);
