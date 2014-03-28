{
  "port": 8125,
  "backends": [ "../../src/leveldb-backend" ],
  "flushInterval": 1000,
  "deleteIdleStats" : true,
  "maxSize" : 300,
  "checkInterval" : "10 seconds",
  "limit" : 8640,
  "boundaries": [
    {
      "boundary" : "1 days",
      "interval" : "1 seconds"
    },
    {
      "boundary" : "1 weeks",
      "interval" : "5 minutes"
    }
  ]
}
