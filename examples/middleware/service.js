/**
 * Created by Ron on 23/08/2017.
 */

const microx = require('../../')
const Events = require('../../').Service.EVENTS

// Define the service instance
let myService = microx({
  name: 'simple-service',
  port: 8080,
  host: '127.0.0.1'
})

// Global middleware that will execute on all methods
myService.use(function(msg, next) {
  // Convert input to numbers
  for (let key in msg.data) {
    if (msg.data.hasOwnProperty(key)) {
      msg.data[key] = msg.data[key] || 0
    }
  }
  next()
})

// Provide a sum method in the service
// The method will get 2 parameters, x and y and will return the sum of them
myService.provide('sum', function sum(msg, reply) {
  reply(null, {sum: msg.data.x + msg.data.y})
})

// Provide a deduct method in the service
// The method will get 2 parameters, x and y and will return the deduction of them
// The method includes a middleware that will check to make sure x is larger than y
myService.provide('deduct', function(msg, next) {
  if (msg.data.x < msg.data.y) {
    return next(new Error('X must be greater than Y'))
  }
  next()
}, function deduct(msg, reply) {
  reply(null, {deduction: msg.data.x - msg.data.y})
})

// Listen to start event and display a log
myService.on(Events.SERVICE_START, function () {
  console.log('Service %s started @%s', this.meta.name, this.meta.port)
})

// Listen to stop event and exit the process
myService.on(Events.SERVICE_STOPPED, function () {
  console.log('Service %s stopped', this.meta.name)
  process.exit()
})

// Start the service
myService.start()