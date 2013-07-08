statsd-leveldb-backend
======================

A backend for StatsD to emit stats to leveldb. Implements the Robin robin **like** database, described in [this comment](https://github.com/rvagg/node-levelup/issues/154#issuecomment-20391086) on the levelup project.

### Goal

***A pure Node statsd stack*** - As statsd only defines the daemon for capturing data, when using it, one also needs to store the data in a statsd compatible "backend" (or database). Then, another tool is used to query this data and display the results. This is just the "backend" portion of the stack - Querying and Graphing still to come. Initial thoughts are leaning towards a pure frontend JavaScript solution, via a WebSockets API, from a server capable of streaming out responses to queries for instant graphing.

### Usage

**Still in prototyping phase...** :smile:

#### MIT License

Copyright © 2013 Jaime Pillora &lt;dev@jpillora.com&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.