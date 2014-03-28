should = require 'should'
moment = require 'moment'
level = require 'level'

interval = require '../src/interval'
query = require '../src/query'
compress = require '../src/compress'
dummyData = require './dummyData'

#StatD's config is in JS format which makes it hard to test because
#require './config.js' produces error
configSrcBuffer = ""
config = {}
db = {}

stats = require './stats-val.json'

before (done) ->
  configSrcBuffer = require('fs').readFileSync('integration/config.js')
  config = JSON.parse configSrcBuffer
  db = dummyData(config.limit)
  done()

after (done) ->
  db.close()
  require('child_process').exec('rm -rf db')
  done()

describe 'Config Check', ->
  it 'should test durations for validity', (done) ->
    config = interval(config)
    curr = moment().unix()
    moment().add(config.checkInterval).unix().should.not.be.exactly(curr)
    config.boundaries.forEach (item) ->
      moment().add(item.boundary).unix().should.not.be.exactly(curr)
      moment().add(item.interval).unix().should.not.be.exactly(curr)
    done()

describe 'Statistical Computation', ->
  makeRecords = (opts) ->
    recs = []
    i = 0
    while i < 5
      r = Math.random() * (100 - 50) + 50
      stats.gauges['switch1.cpu'] = r if opts && opts.randomize
      recs.push {value: JSON.stringify stats}
      i = i + 1
    return recs

  it 'should compute summation', (done) ->
    recs = makeRecords()
    ax = query.accumulate recs

    toVerify = recs.length * stats.gauges['switch1.cpu']
    ax.gauges['switch1.cpu'].should.be.exactly(toVerify)
    done()

  it 'should compute average', (done) ->
    recs = makeRecords()
    avg = query.average recs
    avg.gauges['switch1.cpu'].should.be.exactly(74)

    recs = makeRecords({randomize: true})
    avg= query.average recs
    avg.gauges['switch1.cpu'].should.not.be.exactly(74)
    done()

describe 'Compress', ->
  it 'should compress db of with limit set in the config file', (done) ->
    this.timeout 100000
    compress {db: db, config: config, shouldTimeout: false}, ->
      keyCount = 0
      db.createKeyStream()
        .on 'data', (key) ->
          keyCount = keyCount + 1 if key
        .on 'end',
          ->
            keyCount.should.be.exactly(1)
            done()
