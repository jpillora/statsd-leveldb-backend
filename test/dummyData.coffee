level = require 'level'
moment = require 'moment'
cp = require 'child_process'
assert = require 'assert'
_ = require 'lodash'

util = require '../src/util'

statsJson = JSON.stringify require './stats-val.json'
stats = JSON.parse statsJson

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
  'switch1.cpu': true
  'switch1.port12.rxBytes': true,
  'switch1.port14.rxBytes': true,
  'switch2.cpu': true
}

exports.add = (prefix, noOf, flushInterval) ->
  from = moment()
  to = {}

  start = moment()
  _.forIn keys, (value, key) ->
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

  # util.printDB exports.db
  exports.db.put '/prefixes', JSON.stringify(keys), (err) ->
    console.log err if err

  console.log 'Finished making data. Took %d ms', moment().diff(start, 'ms')
