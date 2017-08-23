# microX

[< Back to index](index.md)

## Middleware

Middleware are functions that runs before a method handler is executed. Middleware functions are used in many frameworks to allow "plugins" of additional functionally that will be executed automatically.

A middleware function takes 2 arguments:
1. `msg` - a `Message` object of the incoming message
2. `next` - a function to call the next middleware or the method handler if no more middleware exists. This function can also be used to stop the execution, to do so, pass an Error object to it.

```js
function mw(msg, next) {
  // msg is a Message object instance
  // next is a function used to call the next middleware / handler, or stop the execution due to error
}
```

microX supports two types of middleware functions:
1. [Global](#global-middleware)
2. [Method specific](#method-specific-middleware)

### Global Middleware

The middleware will be executed before every method. This is useful for validating some required values (for example authentication token), or formatting all incoming messages to another format.

To setup a global middleware, use the `use` method of the service.

```js
const microx = require('microx')

let service = microx({name: 'Simple Service'})

service.use(function(msg, next) {
  // Middleware logic here
  // msg is mutable object, so any changes will affect the next middleware and the method handler
  next() // Must call next function at the end, to allow microX to execute the next middleware in line or to execute the handler function if not more middleware functions exists
})
```

### Method Specific Middleware

The middleware will be executed before a specific method. This is useful for validating some data that is only required by the method, and help keep the method handler function clean without the validation overhead.

To setup a method specific middleware, pass it before the handler function in the `provide` method. You can pass more than one middleware, the functions will be executed in the order they are provided.

```js
const microx = require('microx')

let service = microx({name: 'Simple Service'})

service.provide('method', mw1, mw2, handler)

function mw1(msg, next) {
  console.log('First middleware')
  next()
}

function mw2(msg, next) {
  console.log('Second middleware')
  next()
}

function handler(msg, reply) {
  console.log('Handler function')
  reply()
}
```