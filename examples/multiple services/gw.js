/**
 * Created by Ron on 13/07/2017.
 */
const express = require('express')
const bodyParser = require('body-parser')
const Service = require('../../')

let app = express()

// Define the service instance
let myService = new Service('Monitor', '1.0', 8081, '127.0.0.1', false)

// Define the GW server
// The endpoint will call the math service to get answers

app.use(bodyParser.json())

app.post('/sum', function(req, res) {
  myService.call('math@1.0', 'sum', req.body).then(function(msg) {
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

// Listen to start event and display a log
myService.on(Service.EVENTS.SERVICE_START, function() {
  console.log('Service GW started')
  app.listen(8080, function() {
    "use strict";
    console.log('Gateway is up')
  })
})

// Listen to stop event and exit the process
myService.on(Service.EVENTS.SERVICE_STOPPED, process.exit)

// Start the service
myService.start()
