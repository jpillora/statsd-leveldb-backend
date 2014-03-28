level = require 'level'
moment = require 'moment'
cp = require 'child_process'
_ = require 'lodash'

statsJson = JSON.stringify require './stats-val.json'

module.exports = (limit) ->
  db = level './db'
  from = moment()

  stats = JSON.parse statsJson

  for num in [1..limit]
    to = moment(from).add(1, 'seconds')
    key = 'stat-' + from.valueOf() + '-' + to.valueOf()

    _.forOwn stats.gauges, (value, property) ->
      stats.gauges[property] = Math.random() * (150 - 20) + 20

    # console.log(to.diff(from, 'seconds'))

    db.put key, JSON.stringify(stats), (err) ->
      console.log err if (err)

    from = moment(to)

  db.createKeyStream()
    .on 'data', (key) ->

  return db
