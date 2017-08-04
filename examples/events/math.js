/**
 * Created by Ron on 13/07/2017.
 */

const Service = require('../../')

// Define the service instance
let myService = new Service(new Service.ServiceConfiguration({
  name:'math',
  version: '1.1.0',
  port: 8082,
  host: '127.0.0.1'
}))

// Provide a sum method in the service
// The method will get 2 parameters, x and y and will return the sum of them
myService.provide('sum', function sum(msg, reply) {
  let x = msg.data.x || 0
  let y = msg.data.y || 0

  // Broadcast an event to other services about the operation that was performed
  myService.broadcast('math.sum', {message: 'Math did sum operation', result: x + y})
  reply(null, {result: x + y})
})

// Provide a multiple method in the service
// The method will get 2 parameters, x and y and will return the multiplication of them
myService.provide('multi', function multi(msg, reply) {
  let x = msg.data.x || 0
  let y = msg.data.y || 0

  // Broadcast an event to other services about the operation that was performed
  myService.broadcast('math.multi', {message: 'Math did multiple operation', result: x * y})

  reply(null, {result: x * y})
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

