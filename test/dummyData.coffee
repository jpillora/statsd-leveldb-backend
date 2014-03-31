level = require 'level'
moment = require 'moment'
cp = require 'child_process'
assert = require 'assert'
_ = require 'lodash'

statsJson = JSON.stringify require './stats-val.json'

module.exports = (boundaries) ->
  db = level './db'
  stats = JSON.parse statsJson

  from = {}
  to = {}

  _.forEach boundaries, (each) ->
    from = moment()
    console.log 'Making %d data points... Hold on tight', each.points
    for num in [1..each.points]
      to = moment(from).add(each.interval.asSeconds(), 'seconds')
      key = 'stat-' + from.valueOf() + '-' + to.valueOf()

      _.forOwn stats.gauges, (value, property) ->
        stats.gauges[property] = Math.random() * (150 - 20) + 20

      assert.equal(to.diff(from, 'seconds'), each.interval.asSeconds())

      db.put key, JSON.stringify(stats), (err) ->
        console.log err if (err)

      from = moment(to)

  return db
