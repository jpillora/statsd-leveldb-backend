should = require 'should'
moment = require 'moment'
level = require 'level'

interval = require '../src/interval'
compress = require '../src/compress'
dummyData = require './dummyData'

#StatD's config is in JS format which makes it hard to test because
#require './config.js' produces error
config = {}
db = {}

before (done) ->
  db = dummyData()
  # db = level('./db')
  config = JSON.parse require('fs').readFileSync('integration/config.js')
  done()

after (done) ->
  db.close()
  require('child_process').exec('rm -rf db')
  done()

  it 'should test durations for validity', (done) ->
    config = interval(config)
    curr = moment().unix()
    moment().add(config.checkInterval).unix().should.not.be.exactly(curr)
    config.boundaries.forEach (item) ->
      moment().add(item.boundary).unix().should.not.be.exactly(curr)
      moment().add(item.interval).unix().should.not.be.exactly(curr)
    done()

describe 'Compress', ->
  it 'should compress db of 200 items with interval of 1 seconds', (done) ->

    compress({db: db, config: config, shouldTimeout: false})

    ##Give some time for compress to execute
    setTimeout ( ->
      done()
      ), 1000
