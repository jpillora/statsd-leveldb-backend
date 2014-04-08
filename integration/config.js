{
  "port": 8125,
  "backends": [ "../../src/leveldb-backend" ],
  "flushInterval": 1000,
  "deleteIdleStats" : true,
  "checkInterval" : "20 minutes",
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
