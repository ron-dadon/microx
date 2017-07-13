/**
 * Created by Ron on 13/07/2017.
 */

const Service = require('../../')

// Define the service instance
let myService = new Service('Monitor', '1.0', 8080, '127.0.0.1', false)

// Provide a method in the service
// The method will get 2 parameters, x and y and will return the sum of them
myService.provide('getServices', function sum(msg, reply) {
  let list = []
  for (let service in myService.services) {
    if (!myService.services.hasOwnProperty(service)) continue
    list = list.concat(myService.services[service].toArray())
  }
  // Output the list of all known services
  reply(null, list)
})

// Listen to start event and display a log
myService.on(Service.EVENTS.SERVICE_START, function() {
  console.log('Service started')
})

// Listen to stop event and exit the process
myService.on(Service.EVENTS.SERVICE_STOPPED, process.exit)

// Start the service
myService.start()

