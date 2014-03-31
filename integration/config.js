{
  "port": 8125,
  "backends": [ "../../src/leveldb-backend" ],
  "flushInterval": 1000,
  "deleteIdleStats" : true,
  "maxSize" : 300,
  "checkInterval" : "10 seconds",
  "boundaries": [
    {
      "boundary" : "1 day",
      "interval" : "1 seconds"
    },
    {
      "boundary" : "1 week",
      "interval" : "5 minutes"
    }
  ]
}
