should = require 'should'
moment = require 'moment'
level = require 'level'
_ = require 'lodash'

util = require '../src/util'
query = require '../src/query'
downsample = require '../src/downsample'
dummyData = require './dummyData'

#StatD's config is in JS format which makes it hard to test because
#require './config.js' produces error
configSrcBuffer = ""
cx = {}
config = {}

stats = require './stats-val.json'

before (done) ->
  configSrcBuffer = require('fs').readFileSync('integration/config.js')
  config = JSON.parse configSrcBuffer
  cx = _.cloneDeep(config)
  done()

after (done) ->
  dummyData.db.close()
  require('child_process').exec('rm -rf db')
  done()

describe 'Config Check', ->
  it 'should test durations for validity', (done) ->
    cx = util.initIntervals(cx)
    curr = moment().unix()
    moment().add(cx.checkInterval).unix().should.not.be.exactly(curr)
    cx.boundaries.forEach (item) ->
      moment().add(item.boundary).unix().should.not.be.exactly(curr)
      moment().add(item.interval).unix().should.not.be.exactly(curr)
    done()

  it 'should compute data points for boundaries', (done) ->
    c =
      {
        checkInterval: "20 minutes",
        boundaries: [
          {boundary: '1 day', interval: '1 seconds'},
          {boundary: '1 week', interval: '5 minutes'}
        ]
      }

    c =  util.initIntervals(c)
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

describe 'Compression', ->
  conf = {}
  flushInterval = 0
  initialPoints = 0
  compressionCount = 0
  dataToAdd = 0
  start = {}

  diffInDates = (key) ->
    dates = util.datesInKey(key)
    from = dates.from.format('YYYY-MM-DD hh:mm:ss')
    to = dates.to.format('YYYY-MM-DD hh:mm:ss')
    diff = dates.to.diff(dates.from, 'seconds')
    return {from: from, to: to , diff: diff}

  checkCompressionCount = (done, count) ->
    diffCnst = conf.boundaries[1].interval.asSeconds()
    diffCount = 0
    keyCount = 0

    dummyData.db.createKeyStream()
      .on 'data', (key) ->
        d = diffInDates(key)
        diffCount = diffCount + 1 if d.diff == diffCnst
      .on 'end',
        ->
          console.log 'Count with interval %d secs: %d ', diffCnst, diffCount
          diffCount.should.be.exactly(count)
          done()

  compress = (done, checkCount) ->
    downsample {db: dummyData.db, config: conf, shouldTimeout: false},
      (boundarySize) ->
        checkCompressionCount(done, checkCount)

  countTotal = (done) ->
    count = 0
    dummyData.db.createKeyStream()
      .on 'data', (key) ->
        d = diffInDates(key)
        # console.log('%s - %s, %d secs', d.from, d.to, d.diff)
        count = count + 1
      .on 'end',
        ->
          console.log '#Records: ' + count
          done()

  it 'should setup initial dummy data', (done) ->
    conf = util.initIntervals(_.cloneDeep(config))
    flushInterval = conf.boundaries[0].interval.asSeconds()
    initialPoints = conf.boundaries[0].boundary.asSeconds() +
                    conf.checkInterval.asSeconds()
    compressionCount =  conf.checkInterval.asSeconds() /
            conf.boundaries[1].interval.asSeconds()
    dataToAdd = conf.checkInterval.asSeconds()
    done()

  it 'should add first round data and compress db', (done) ->
    this.timeout 200000
    start = moment()
    dummyData.add 'stat', start, initialPoints, flushInterval
    compress done, compressionCount

  it 'should add second round data and compress db', (done) ->
    this.timeout 200000

    start.add conf.checkInterval
    start.add conf.checkInterval

    dummyData.add 'stat', start, dataToAdd, flushInterval
    compress done, compressionCount * 2

  it 'should list the total records in the db', (done) ->
    this.timeout 100000
    countTotal(done)
