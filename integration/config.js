{
  "port": 8125,
  "backends": [ "../../src/leveldb-backend" ],
  "flushInterval": 1000,
  "deleteIdleStats" : true,
  "maxSize" : 300,
  "checkInterval" : "10 seconds",
  "boundaries": [
    {
      "boundary" : "10 seconds",
      "interval" : "1 seconds"
    },
    {
      "boundary" : "1 minutes",
      "interval" : "1 minutes"
    }
  ]
}
