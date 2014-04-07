{
  "port": 8125,
  "backends": [ "../../src/leveldb-backend" ],
  "flushInterval": 1000,
  "deleteIdleStats" : true,
  "maxSize" : 300,
  "checkInterval" : "20 minutes",
  "boundaries": [
    {
      "boundary" : "1 days",
      "interval" : "1 minutes"
    },
    {
      "boundary" : "1 weeks",
      "interval" : "5 minutes"
    }
  ]
}
