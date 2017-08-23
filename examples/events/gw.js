/**
 * Created by Ron on 13/07/2017.
 */
const express = require('express')
const bodyParser = require('body-parser')
const microx = require('../../')
const Events = require('../../').Service.EVENTS

let app = express()

// Define the service instance
let myService = microx({
  name: 'gw',
  port: 8081,
  host: '127.0.0.1'
})

// Define the GW server
// The endpoint will call the math service to get answers

app.use(bodyParser.json())

app.post('/sum', function(req, res) {
  myService.call('math', 'sum', req.body).then(function(msg) {
    res.json(msg.data)
  }).catch(function(err) {
    res.status(err.statusCode || 500).json(err.message)
  })
})

app.post('/multi', function(req, res) {
  myService.call('math@1.0', 'multi', req.body).then(function(msg) {
    res.json(msg.data)
  }).catch(function(err) {
    res.status(err.statusCode || 500).json(err.message)
  })
})

app.get('/last', function(req, res) {
  myService.call('log@1.0', 'get').then(function(msg) {
    res.json(msg.data)
  }).catch(function(err) {
    res.status(err.statusCode || 500).json(err.message)
  })
})

// Listen to start event and display a log
myService.on(Events.SERVICE_START, function() {
  console.log('Service %s@%s started', this.meta.name, this.meta.version)
  app.listen(8080, function() {
    console.log('Gateway is up')
  })
})

// Listen to stop event and exit the process
myService.on(Events.SERVICE_STOPPED, function () {
  console.log('Service %s@%s stopped', this.meta.name, this.meta.version)
  process.exit()
})

// Start the service
myService.start()
