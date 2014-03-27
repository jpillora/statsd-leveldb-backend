level = require 'level'
moment = require 'moment'
cp = require 'child_process'
stats = JSON.stringify require './stats-val.json'

module.exports = ->
  db = level './db'
  from = moment()

  for num in [1..200]
    to = moment(from).add(1, 'seconds')
    key = 'stat-' + from.valueOf() + '-' + to.valueOf()

    # console.log(to.diff(from, 'seconds'))

    db.put key, stats, (err) ->
      console.log err if (err)

    from = moment(to)

  db.createKeyStream()
    .on 'data', (key) ->

  return db
