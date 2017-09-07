/**
 * Created by Ron on 13/07/2017.
 */

const microx = require('../../')
const Events = require('../../').Service.EVENTS

// Define the service instance
let myService = microx({
  name: 'Monitor',
  port: 8080,
  host: '127.0.0.1'
})

// Provide a method in the service
// The method will get 2 parameters, x and y and will return the sum of them
myService.provide('getServices', function sum(msg, reply) {
  // Output the list of all known services
  reply(null, myService.getServices())
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

// Listen to stop event and exit the process
myService.on(Events.SERVICE_PING, function (meta) {
  console.log('Service %s@%s pinged: %j', meta.name, meta.version, meta)
})

// Start the service
myService.start()

