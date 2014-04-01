should = require 'should'
moment = require 'moment'
level = require 'level'
_ = require 'lodash'

interval = require '../src/interval'
query = require '../src/query'
downsample = require '../src/downsample'
dummyData = require './dummyData'

#StatD's config is in JS format which makes it hard to test because
#require './config.js' produces error
configSrcBuffer = ""
db = {}
cx = {}
config = {}

stats = require './stats-val.json'

before (done) ->
  configSrcBuffer = require('fs').readFileSync('integration/config.js')
  config = JSON.parse configSrcBuffer
  cx = _.cloneDeep(config)
  done()

after (done) ->
  db.close()
  require('child_process').exec('rm -rf db')
  done()

describe 'Config Check', ->
  it 'should test durations for validity', (done) ->
    cx = interval(cx)
    curr = moment().unix()
    moment().add(cx.checkInterval).unix().should.not.be.exactly(curr)
    cx.boundaries.forEach (item) ->
      moment().add(item.boundary).unix().should.not.be.exactly(curr)
      moment().add(item.interval).unix().should.not.be.exactly(curr)
    done()

  it 'should compute data points for boundaries', (done) ->
    c =
      {
        boundaries: [
          {boundary: '1 day', interval: '1 seconds'},
          {boundary: '1 week', interval: '5 minutes'}
        ]
      }

    c =  interval(c)
    c.boundaries[0].points.should.be.exactly(86400)
    c.boundaries[1].points.should.be.exactly(604800)

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

describe 'Unit Compression', ->
  conf = {}

  it 'should make dummy data', (done) ->
    conf = interval(_.cloneDeep(config))
    db = dummyData(conf)
    done()

  it 'should compress db', (done) ->
    this.timeout 200000
    downsample {db: db, config: conf, shouldTimeout: false}, (boundarySize) ->
      #done if all boundaries have been traversed
      done() if boundarySize.index == boundarySize.size

  it 'should ensure that the dates in compressed data are correct', (done) ->
    this.timeout 3000
    keyCount = 0
    toJump = conf.boundaries[0].boundary.asSeconds()
    db.createKeyStream()
      .on 'data', (key) ->
        keyCount = keyCount + 1
        if keyCount > toJump
          dates = interval.datesInKey(key)
          from = dates.from.format('YYYY-MM-DD hh:mm:ss')
          to = dates.to.format('YYYY-MM-DD hh:mm:ss')
          diff = dates.to.diff(dates.from, 'seconds')
          console.log '%s - %s Diff: %s secs', from, to, diff
      .on 'end',
        ->
          console.log 'Compressed Key Count: %d', keyCount - toJump
          done()

describe 'Flow Compression', ->
