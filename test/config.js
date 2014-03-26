{
  "port": 8125,
  "backends": [ "../../leveldb-backend" ],
  "flushInterval": 100,
  "maxSize" : 1e10,
  "boundaries": [
    {
      "boundary" : "1 day",
      "interval" : "1 second"
    },
    {
      "boundary" : "1 week",
      "interval" : "5 minutes"
    }
  ]
}
