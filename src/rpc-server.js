/**
 * Created by ron on 7/12/2017.
 */

const express = require('express')
const jsonBodyParser = require('body-parser').json
const cors = require('cors')
const Message = require('./message')

class RpcServer {

  /**
   *
   * @param {Service} service
   */
  constructor(service) {
    this.service = service
    this.app = express()
    this.app.use(cors())
    this.app.use(jsonBodyParser())
    this.server = null
    this.methodHandlers = {}
    this.eventHandlers = {}
    this.running = false
    this._init()
  }

  /**
   * Start the server
   * The server will listen on the port as specified in the service meta properties
   *
   * @returns {Promise}
   */
  start() {
    return new Promise((function(res, rej) {
      try {
        this.server = this.app.listen(this.service.meta.port, res)
        this.running = true
      } catch (e) {
        rej(e)
      }
    }).bind(this))
  }

  /**
   * Stop the server
   */
  stop() {
    // Check if server has started
    if (!this.running || !this.server) return

    try {
      // Stop the low level HTTP server returned by the express listen() call
      this.server.stop()
      this.running = false
    } catch (e) {
      // TODO: Handler error
    }
  }

  /**
   * Setup a method handler
   * The handler function signature is (Message, Reply function)
   * The reply function signature is a standard callback signature (Error, data)
   *
   * @param {String} method Name of the method
   * @param {Function} handler Handler function
   * @returns {RpcServer} Returns the instance of the server to provide method chaining
   */
  provide(method, handler) {
    // Set method handler
    this.methodHandlers[method] = handler
    return this
  }

  /**
   * Setup a event handler
   * The handler function signature is (Event)
   *
   * @param {String} event Name of the event
   * @param {Function} handler Handler function
   * @returns {RpcServer} Returns the instance of the server to provide method chaining
   */
  onEvent(event, handler) {
    // Set method handler
    this.eventHandlers[event] = handler
    return this
  }

  /**
   * Initialize the server application to handle methods and errors
   *
   * @private
   */
  _init() {
    // Setup method handler endpoint
    this.app.post('/:method', this._methodHandler.bind(this))

    // Setup error handler middleware
    this.app.use(this._errorHandler.bind(this))

    // Setup events listener
    this.provide('__event', this._eventHandler.bind(this))
  }

  /**
   * Handle events
   *
   * @param {Message} msg Incoming message object
   * @param {Function} reply Reply function
   * @private
   */
  _eventHandler(msg, reply) {

    // Find if any * events listeners exists that match the event name
    let regexEvents = {}

    for (let eventKey in this.eventHandlers) {
      if (!this.eventHandlers.hasOwnProperty(eventKey)) continue
      if (eventKey.indexOf('*') >= 0) {
        let regex = new RegExp(eventKey.replace(/\*/g, '.*'))
        if (regex.test(msg.data.name)) {
          regexEvents[eventKey] = true
        }
      }
    }

    // Ignore event that the server does not listen to
    if (!this.eventHandlers[msg.data.name] && Object.keys(regexEvents).length === 0) return

    // Update events metrics
    this.service.metrics.eventsCount++

    // Update specific event metrics
    if (!this.service.metrics.events[msg.data.name]) {
      this.service.metrics.events[msg.data.name] = 0
    }
    this.service.metrics.events[msg.data.name]++

    // Call the event handler or / and the matched * handlers
    if (this.eventHandlers[msg.data.name]) {
      this.eventHandlers[msg.data.name](msg.data, this.service)
    }
    for (let eventKey in regexEvents) {
      if (!regexEvents.hasOwnProperty(eventKey)) continue
      this.eventHandlers[eventKey](msg.data, this.service)
    }

    // wait for the reply function to be called to notify the sending service that the event was handled
    // this is critical for clearing the event from the queue in the sending service
    reply()
  }

  /**
   * Handle methods calls
   * If method does not exist, pass an error to the next middleware
   *
   * @param {IncomingMessage} req Request object
   * @param {OutgoingMessage} res Response object
   * @param {Function} next Next middleware call function
   * @private
   */
  _methodHandler(req, res, next) {
    // Update metrics
    this.service.metrics.requestsCount++

    // If method does not exists, call the next middleware with an error
    if (!this.methodHandlers[req.params.method]) {
      let err = new Error('Method does not exist')
      err.statusCode = 404
      return next(err)
    }

    // Update specific request metrics
    if (!this.service.metrics.requests[req.params.method]) {
      this.service.metrics.requests[req.params.method] = 0
    }
    this.service.metrics.requests[req.params.method]++

    // Construct the message from the HTTP IncomingMessage
    let sourceMsg = new Message(req.body, req.headers)

    // Call the method handler, and wait for the reply function to be called
    this.methodHandlers[req.params.method](sourceMsg, (function(err, data) {
      if (err) {
        return next(err)
      }
      let responseMsg = new Message(data, sourceMsg.headers, this.service.meta.versionName)
      res.json(responseMsg)
    }).bind(this), this.service)
  }

  /**
   * Handle errors and unsupported methods
   *
   * @param {Error} err Error object
   * @param {IncomingMessage} req Request object
   * @param {OutgoingMessage} res Response object
   * @param {Function} next Next middleware call function
   * @private
   */
  _errorHandler(err, req, res, next) {
    // If this middleware is reached, and err is undefined, than the call was to an invalid endpoint
    if (!err) {
      let err = new Error('Invalid request')
      err.statusCode = 400
    }

    // Construct response message
    let responseMsg = new Message({
      code: err.statusCode,
      message: err.message
    }, req.headers, this.service.meta.versionName)

    // Send the response
    res.status(err.statusCode || 500).json(responseMsg)

    // Update error metrics and specific error metrics
    this.service.metrics.errorsCount++
    if (!this.service.metrics.errors[err.message]) {
      this.service.metrics.errors[err.message] = 0
    }
    this.service.metrics.errors[err.message]++
  }

}

module.exports = RpcServer