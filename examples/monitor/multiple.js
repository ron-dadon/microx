/**
 * Created by Ron on 13/07/2017.
 */

const microx = require('../../')
const Events = require('../../').Service.EVENTS

// Define the service instance
let myService = microx({
  name: 'Multiple',
  port: 8082,
  host: '127.0.0.1'
})

// Provide a method in the service
// The method will get 2 parameters, x and y and will return the multiple of them
myService.provide('multiple', function multiple(msg, reply) {
    let x = msg.data.x || 0
    let y = msg.data.y || 0
    reply(null, {result: x * y})
})

// Listen to start event and display a log
myService.on(Events.SERVICE_START, function() {
  console.log('Service %s@%s started', this.meta.name, this.meta.version)
})

// Listen to stop event and exit the process
myService.on(Events.SERVICE_STOPPED, function () {
  console.log('Service %s@%s stopped', this.meta.name, this.meta.version)
  process.exit()
})

// Start the service
myService.start()

