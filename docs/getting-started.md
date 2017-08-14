# microX

[< Back to index](index.md)

## Getting Started

Building micro-services with microX is as easy as it gets.

First, install microX using npm or yarn.

```sh
$ npm install microx --save
```

Now create a `.js` file, for example `index.js`, and require the `microx` module.

```js
const Service = require('microx')
```

Requiring `microx` will return the `Service` constructor. We can use this constructor to build our service instance.

Lets build a simple service, will call it `math`, and it will run on port 8000:

```js
const Service = require('microx')

let service = new Service({
  port: 8000,
  name: 'math'
})
```

`service` holds the instance of our service.

We can now use the `provide` method to register a method handler in the service.

Lets create a method `sum` that will add up 2 numbers.

```js
const Service = require('microx')

let service = new Service({
  port: 8000,
  name: 'math'
})

service.provide('sum', function(msg, reply, instance) {
  if (!Number.isInteger(msg.data.n1) || !Number.isInteger(msg.data.n2)) {
    return reply(new Error('Invalid n1 or n2 value'))
  }
  reply(null, {result: msg.data.n1 + msg.data.n2})
})
```

Our sum function is ready! The function validates the input data, and reply with an error if the data is not valid. If the data is valid, it replys with an object that contains a property `result` that is the result of adding `n1` and `n2`.

All that is left is to start our service so it can accept calls from other services. We'll use the `start` method.

```js
const Service = require('microx')

let service = new Service({
  port: 8000,
  name: 'math'
})

service.provide('sum', function(msg, reply, instance) {
  if (!Number.isInteger(msg.data.n1) || !Number.isInteger(msg.data.n2)) {
    return reply(new Error('Invalid n1 or n2 value'))
  }
  reply(null, {result: msg.data.n1 + msg.data.n2})
})

service.start()
```

Our service is up and running!

To test the service, perform a POST request to `http://localhost:800/sum` with `Content-Type: application/json` header and body of `{"n1": 1, "n2": 2}`.
