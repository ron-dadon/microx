/**
 * Created by Ron on 13/07/2017.
 */
const Service = require('../../')

// Array of last events from the service
let lastEvents = []

// Define the service instance
let myService = new Service('log', '1.0', 8083, '127.0.0.1', false)

// Provide a get method in the service
// The method will return the last 5 events logged in the system
myService.provide('get', function sum(msg, reply) {
  reply(null, lastEvents)
})

// Listen to update math.op event
myService.onEvent('math.*', function(event) {
  lastEvents.push(event)
  if (lastEvents.length > 5) {
    lastEvents.splice(0, lastEvents.length - 5)
  }
})

// Listen to start event and display a log
myService.on(Service.EVENTS.SERVICE_START, function() {
  console.log('Log service started')
})

// Listen to stop event and exit the process
myService.on(Service.EVENTS.SERVICE_STOPPED, process.exit)

// Start the service
myService.start()
