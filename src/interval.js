var _ = require('lodash')
var moment = require('moment')

module.exports = function(config) {
  var c = _.extend(config)
  var tmp = config.checkInterval.split(' ')

  c.checkInterval = makeDuration(config.checkInterval)
  c.boundaries.forEach(function(item) {
    item.boundary = makeDuration(item.boundary)
    item.interval = makeDuration(item.interval)
  })

  return c
}

function makeDuration(configItem) {
  var tmp = configItem.split(' ')
  return moment.duration(parseInt(tmp[0]), tmp[1])
}
