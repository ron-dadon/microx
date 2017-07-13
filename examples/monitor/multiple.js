/**
 * Created by Ron on 13/07/2017.
 */

const Service = require('../../')

// Define the service instance
let myService = new Service('Service Multiple', '1.0', 8082, '127.0.0.1', false)

// Provide a method in the service
// The method will get 2 parameters, x and y and will return the multiple of them
myService.provide('multiple', function multiple(msg, reply) {
    let x = msg.data.x || 0
    let y = msg.data.y || 0
    reply(null, {result: x * y})
})

// Listen to start event and display a log
myService.on(Service.EVENTS.SERVICE_START, function() {
    console.log('Service Multiple started')
})

// Listen to stop event and exit the process
myService.on(Service.EVENTS.SERVICE_STOPPED, process.exit)

// Start the service
myService.start()

