level = require 'level'
moment = require 'moment'
cp = require 'child_process'
assert = require 'assert'
_ = require 'lodash'

statsJson = JSON.stringify require './stats-val.json'

db = level './db'

module.exports = (cfg) ->
  stats = JSON.parse statsJson

  flushInterval = cfg.boundaries[0].interval.asSeconds()
  points = cfg.boundaries[0].boundary.asSeconds() +
   cfg.checkInterval.asSeconds()

  # _.forEach boundaries, (item) ->
  #   points += item.boundary.asSeconds()

  addData(points)
  return db

module.exports.addData = (noOf) ->
  from = {}
  to = {}

  console.log 'Making %d data points... Hold on tight', points
  for num in [1..points]
    to = moment(from).add(flushInterval, 'seconds')
    key = 'stat-' + from.valueOf() + '-' + to.valueOf()

    _.forOwn stats.gauges, (value, property) ->
      stats.gauges[property] = Math.random() * (150 - 20) + 20

    assert.equal(to.diff(from, 'seconds'), flushInterval)

    db.put key, JSON.stringify(stats), (err) ->
      console.log err if (err)

    from = moment(to)
