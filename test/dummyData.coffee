level = require 'level'
moment = require 'moment'
cp = require 'child_process'
assert = require 'assert'
_ = require 'lodash'

util = require '../src/util'

statsJson = JSON.stringify require './stats-val.json'
stats = JSON.parse statsJson

exports.db = level './db'

keys = ['switch1.cpu',
        'switch1.port12.,rxBytes',
        'switch1.port14.rxBytes',
        'switch2.cpu']

exports.add = (prefix, startTime, noOf, flushInterval) ->
  from = startTime
  to = {}

  console.log 'Making %d data points... Hold on tight', noOf
  num = 0
  while num < noOf
    to = moment(from).add(flushInterval, 'seconds')
    key = util.makeKeyFromDates('switch1.cpu', from, to)

    _.forOwn stats.gauges, (value, property) ->
      stats.gauges[property] = Math.random() * (150 - 20) + 20

    assert.equal(to.diff(from, 'seconds'), flushInterval)

    exports.db.put key, JSON.stringify(stats), (err) ->
      console.log err if (err)

    from = moment(to)
    num = num + 1
