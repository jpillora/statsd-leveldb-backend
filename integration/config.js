{
  "port": 8125,
  "backends": [ "../../src/leveldb-backend" ],
  "flushInterval": 1000,
  "deleteIdleStats" : true,
  "maxSize" : 300,
  "checkInterval" : "1 minutes",
  "boundaries": [
    {
      "boundary" : "1 days",
      "interval" : "1 seconds"
    },
    {
      "boundary" : "5 minutes",
      "interval" : "1 minutes"
    }
  ]
}
