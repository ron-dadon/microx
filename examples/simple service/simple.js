/**
 * Created by Ron on 13/07/2017.
 */

const microx = require('../../')
const Events = require('../../').Service.EVENTS

// Define the service instance
let myService = microx({
  name: 'simple-service',
  port: 8080,
  host: '127.0.0.1'
})

// Provide a method in the service
// The method will get 2 parameters, x and y and will return the sum of them
myService.provide('sum', function sum(msg, reply) {
  let x = msg.data.x || 0
  let y = msg.data.y || 0
  reply(null, {sum: x + y})
})

// Listen to start event and display a log
myService.on(Events.SERVICE_START, function () {
  console.log('Service %s started', this.meta.name)
})

// Listen to stop event and exit the process
myService.on(Events.SERVICE_STOPPED, function () {
  console.log('Service %s stopped', this.meta.name)
  process.exit()
})

// Start the service
myService.start()