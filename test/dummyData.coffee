level = require 'level'
moment = require 'moment'
cp = require 'child_process'
assert = require 'assert'
_ = require 'lodash'

util = require '../src/util'

statsJson = JSON.stringify require './stats-val.json'
stats = JSON.parse statsJson

Worker = require('webworker-threads').Worker

exports.db = level './db'

 # rxPackets:  1,
 # txPackets:  2,
 # rxBytes:    3,
 # txBytes:    4,
 # rxDropped:  5,
 # txDropped:  6,
 # rxErrors:   7,
 # txErrors:   8,
 # rxOverErr:  10,
 # rxCrcErr:   11,
 # collisions: 12

keys = {
  # 'switch1.port12.rxBytes': true,
  # 'switch1.port14.rxBytes': true,

  'switch1.cpu': true,
  'switch2.cpu': true,
  'switch3.cpu': true,
  'switch4.cpu': true,
  'switch5.cpu': true,
  'switch6.cpu': true,
  'switch7.cpu': true,
  'switch8.cpu': true,
  'switch9.cpu': true,
  'switch10.cpu': true,
  'switch11.cpu': true,
  'switch12.cpu': true,
  'switch13.cpu': true,
  'switch14.cpu': true,
  'switch15.cpu': true,
  'switch16.cpu': true,
  'switch17.cpu': true,
  'switch18.cpu': true,
  'switch19.cpu': true,
  'switch20.cpu': true,
  'switch21.cpu': true
  'switch22.cpu': true,
  'switch23.cpu': true,
  'switch24.cpu': true,
  'switch25.cpu': true,
  'switch26.cpu': true,
  'switch27.cpu': true,
  'switch28.cpu': true,
  'switch29.cpu': true,
  'switch30.cpu': true,

  'switch31.cpu': true
  'switch32.cpu': true,
  'switch33.cpu': true,
  'switch34.cpu': true,
  'switch35.cpu': true,
  'switch36.cpu': true,
  'switch37.cpu': true,
  'switch38.cpu': true,
  'switch39.cpu': true,
  'switch40.cpu': true,

  'switch41.cpu': true
  'switch42.cpu': true,
  'switch43.cpu': true,
  'switch44.cpu': true,
  'switch45.cpu': true,
  'switch46.cpu': true,
  'switch47.cpu': true,
  'switch48.cpu': true,
  'switch49.cpu': true,
  'switch50.cpu': true

}

exports.add = (noOf, flushInterval) ->
  from = moment()
  to = {}

  console.time('make-data')

  dataMaker = (key) ->
    onmessage = (event) ->
      self.close()
      return

    console.log 'Making %d data points for key %s... Hold on tight', noOf, key
    num = 0
    while num < noOf
      to = moment(from).add flushInterval, 'seconds'

      k = util.makeKeyFromDates key, from, to
      stats.gauges[key] = Math.random() * (150 - 20) + 20

      assert.equal(to.diff(from, 'seconds'), flushInterval)

      exports.db.put k, JSON.stringify(stats), (err) ->
        console.log err if (err)

      from = moment(to)
      num = num + 1
    return

  exports.db.put '0', JSON.stringify(keys), (err) ->
    console.log err if err

  # for key,value of keys
  #   console.log 'Spawing data maker for ' + key
  #   worker = new Worker(dataMaker(key))
  #   worker.postMessage('done')

  console.timeEnd('make-data')
