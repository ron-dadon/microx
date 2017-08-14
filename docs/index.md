#microX

## Table of Contents

1. [What is microX?](#what-is-microx)
2. [Installation](#installation)
3. [Architecture](architecture.md)
4. [Getting Started](getting-started.md)
5. [API](api.md)
6. [Examples](#examples)
6. [License](#license)

### NOTICE: UNDER DEVELOPMENT
microX is under ongoing development. **Breaking changes may occur at any time until the first stable version will be released.**

## What is microX?
Microservices architecture adaptation is growing every day, making the agile development process easier and more productive
but comes with a cost - each service is simple, but managing an entire eco-system of microservices is
not a walk in the park. There are many known and highly adapted solutions, such as Sensca, but when I started my journey with
microservices I wanted to develop my own framework, for deeper understanding of the mechanics of microservices.
 
This project is for self learning experience, but after it will be completed, I will give it a test
run on a production project. Sure, it is not the fastest as it is built on top of HTTP using
express framework (TCP based frameworks are much faster), but the simplicity of using it and scaling it makes it a good tool for rapid development.

## Installation

### Prerequisites

microX depends on Redis as the publish-subscribe engine that enables all the services to broadcast their states to other services.
You need to have a Redis server up and running to run microX.
When using the default Redis configuration (no authentication, localhost and default port), no Redis configuration is required in the module.
If the Redis server requires authentication, is not on localhost and/or not using default port, please see [`ioredis`](https://github.com/luin/ioredis) documentation for the configuration options as `microX` uses `ioredis` for Redis integration.

You can pass the configuration object for Redis in the service configuration object under `redisConfig` property.

### Package managers

Via NPM:

```
$ npm install microx --save
```

Via YARN:

```
$ yarn add microx
```

## Examples

See the following examples for better understanding of how to use microX.

1. [Simple service](https://github.com/ron-dadon/microx/blob/master/examples/simple%20service/simple.js)
2. [Multiple services](https://github.com/ron-dadon/microx/tree/master/examples/multiple%20services)
3. [Events](https://github.com/ron-dadon/microx/tree/master/examples/events)
4. [Monitoring](https://github.com/ron-dadon/microx/tree/master/examples/monitor)

## License

MIT License

Copyright (c) 2017 Ron Dadon

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.