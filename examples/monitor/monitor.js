/**
 * Created by Ron on 13/07/2017.
 */

const Service = require('../../')

// Define the service instance
let myService = new Service(new Service.ServiceConfiguration({
  name: 'Monitor',
  port: 8080,
  host: '127.0.0.1'
}))

// Provide a method in the service
// The method will get 2 parameters, x and y and will return the sum of them
myService.provide('getServices', function sum(msg, reply) {
  // Output the list of all known services
  reply(null, myService.getServices())
})

// Listen to start event and display a log
myService.on(Service.EVENTS.SERVICE_START, function() {
  console.log('Service %s@%s started', this.meta.name, this.meta.version)
})

// Listen to stop event and exit the process
myService.on(Service.EVENTS.SERVICE_STOPPED, function () {
  console.log('Service %s@%s stopped', this.meta.name, this.meta.version)
  process.exit()
})

// Start the service
myService.start()

