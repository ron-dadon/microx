/**
 * Created by Ron on 13/07/2017.
 */

const Service = require('../../')

// Define the service instance
let myService = new Service('My Service', '1.0', 8080, '127.0.0.1', false)

// Provide a method in the service
// The method will get 2 parameters, x and y and will return the sum of them
myService.provide('sum', function sum(msg, reply) {
    let x = msg.data.x || 0
    let y = msg.data.y || 0
    reply(null, {sum: x + y})
})

// Listen to start event and display a log
myService.on(Service.EVENTS.SERVICE_START, function() {
    console.log('Service started')
})

// Listen to stop event and exit the process
myService.on(Service.EVENTS.SERVICE_STOPPED, process.exit)

// Start the service
myService.start()

