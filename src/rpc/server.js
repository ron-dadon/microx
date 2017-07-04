/**
 * Created by Ron on 03/07/2017.
 */

const express = require('express')
const jsonParser = require('body-parser').json
const HttpsStatus = require('http-status-codes')
const EventEmitter = require('events')
const ServerMetrics = require('../server-metrics')
const Message = require('../message')
const Event = require('../event')
const kc = require('kebab-case')

/**
 * A RPC server wrapper for express application
 * This class provides the basic functionally required by a HTTP based JSON-RPC server
 *
 * @type {Server}
 */
module.exports = class Server extends EventEmitter {

  /**
   * Initialize server objects
   * Create method and event handlers stack
   * Create empty metrics object
   * Initialize express application and set default routes and event handler
   */
  constructor() {
    super()
    this.methodHandlers = {}
    this.eventHandlers = {}
    this.metrics = new ServerMetrics()
    this.server = express()
    this.server.use(jsonParser())
    this.server.post('/__health-check', this._healthCheckHandler.bind(this))
    this.server.post('/__ping', this._pingHandler.bind(this))
    this.server.post('/__events', this._eventHandler.bind(this))
    this.server.post('/:method', this._msgParser.bind(this), this._methodHandler.bind(this))
    this.server.use(this._errorHandler.bind(this))
  }

  /**
   * Start the express app server
   *
   * @param {Number} port Listen on this port
   * @param {String} [host] Listen on this host
   */
  listen(port, host) {
    let emit = this.emit.bind(this)
    let metrics = this.metrics
    this.server.listen(port, host, () => {
      metrics.startedAt = Date.now()
      emit('listening', port, host)
    })
  }

  /**
   * Register a method for this server
   * When a client will call the method, the handler will be invoked
   * Handler function get 2 arguments:
   * 1. msg - Message object
   * 2. reply - A reply function, the function takes 2 arguments, first one is an error if occurred, second is the reply data
   *
   * @param {String} method Method name
   * @param {Function} handler A reply function
   * @returns {boolean} True if method registered successfully, false otherwise
   */
  provide(method, handler) {
    if (typeof handler !== 'function') return false
    method = kc(method)
    if (['__events', '__ping', '__health-check'].indexOf(method) >= 0) return false
    this.methodHandlers[method] = handler
    this.emit('methodProvided', method)
    return true
  }

  /**
   * Register an event reaction function that will react to events
   * The reaction function will get a single argument, an Event object with the event data and metadata
   *
   * @param {String} event Event name
   * @param {Function} handler Event reaction function
   * @returns {boolean} True if event reaction function registered successfully, false otherwise
   */
  react(event, handler) {

    // Check if handler is a function, only functions can be registered as handlers
    if (typeof handler !== 'function') return false

    // Normalize the event name, as events emitted by clients are normalized
    event = kc(event)

    // Setup the event reaction function and emit an internal event
    this.eventHandlers[event] = handler
    this.emit('listeningToEvent', event)
  }

  /**
   * A health check procedure handler
   * The handler will send all the metrics back to the requesting client
   *
   * @param {express.IncomingMessage} req Express request object
   * @param {express.OutgoingMessage} res Express response object
   * @private
   */
  _healthCheckHandler(req, res) {
    this.metrics.healthChecksCount++
    this.metrics.upTime = Date.now() - this.metrics.startedAt
    this.metrics.lastHealthCheck = Date.now()
    res.json(this.metrics)
    this.emit('healthChecked', this.metrics)
  }

  /**
   * A simple ping handler, responds with empty response and 204 NO CONTENT status
   * Used by clients to validate that the server is alive and reachable
   *
   * @param {express.IncomingMessage} req Express request object
   * @param {express.OutgoingMessage} res Express response object
   * @private
   */
  _pingHandler(req, res) {
    this.metrics.pingsCount++
    this.metrics.lastPing = Date.now()
    res.status(HttpsStatus.NO_CONTENT).send()
    this.emit('pinged', this.metrics.lastPing)
  }

  /**
   * Handle incoming events and invoke the matching event reaction functions
   *
   * @param {express.IncomingMessage} req Express request object
   * @param {express.OutgoingMessage} res Express response object
   * @param {Function} next Trigger the next middleware
   * @private
   */
  _eventHandler(req, res, next) {
    // Update metrics
    this.metrics.eventsCount++

    // Parse body to Event object
    let event = new Event(req.body)

    // Send NO CONTENT success response to release the event emitter and handle the rest of the event internally
    res.status(HttpsStatus.NO_CONTENT).send()

    // Emit internal event about the incoming event
    this.emit('eventReceived', event)

    // Validate that the event reaction function exists and is a function
    if (typeof this.eventHandlers[event.name] === 'function') {
      // Add specific event metrics
      if (!this.metrics.events[event.name]) {
        this.metrics.events[event.name] = 1
      } else {
        this.metrics.events[event.name]++
      }
      // React to the event and emit internal event that the event was reacted
      this.eventHandlers[event.name](event)
      this.emit('eventHandled', event)
    } else {
      // Emit internal event that the event is discarded
      this.emit('eventDiscarded', event)
    }
  }

  /**
   * Handle method calls and invoke the proper method handler
   *
   * @param {express.IncomingMessage} req Express request object
   * @param {express.OutgoingMessage} res Express response object
   * @param {Function} next Trigger the next middleware
   *
   * @returns {*}
   * @private
   */
  _methodHandler(req, res, next) {
    // Update metrics
    this.metrics.methodsCount++

    // Get method name from the request parameters and normalize it
    let method = req.params.method ? kc(req.params.method) : ''

    // Validate the method handler exists and is a function
    if (!method || !this.methodHandlers[method] || typeof this.methodHandlers[method] !== 'function') {
      let err = new Error(HttpsStatus.getStatusText(HttpsStatus.METHOD_NOT_ALLOWED))
      err.statusCode = HttpsStatus.METHOD_NOT_ALLOWED
      this.emit('invalidMethod', method)
      return next(err)
    }
    // Fetch method call Message object from the request
    let msg = req.msg

    // Update method specific metrics
    if (!this.metrics.methods[method]) {
      this.metrics.methods[method] = 1
    } else {
      this.metrics.methods[method]++
    }

    // Handle method
    this.methodHandlers[method](msg, (err, data) => {

      // Emit internal event about method handled
      this.emit('methodHandled', err, data)

      // Go to the error handler if error occurred
      if (err) {
        return next(err)
      }

      // Reply with the response
      res.json(data)
      next()
    })
  }

  /**
   * Handler errors globally
   *
   * @param {Error} err Error object is error occurred
   * @param {express.IncomingMessage} req Express request object
   * @param {express.OutgoingMessage} res Express response object
   * @param {Function} next Trigger the next middleware
   * @returns {*}
   * @private
   */
  _errorHandler(err, req, res, next) {
    // If no error occurred, skip the handler
    if (!err) return next()

    // Update metrics and specific error metrics
    this.metrics.errorsCount++
    if (!this.metrics.errors[err.statusCode || 500]) {
      this.metrics.errors[err.statusCode || 500] = 1
    } else {
      this.metrics.errors[err.statusCode || 500]++
    }

    // Emit internal error event
    this.emit('internalError', err)

    // Respond with error
    res.status(err.statusCode || 500).json({
      statusCode: err.statusCode || 500,
      message: err.message
    })
  }

  /**
   * Parse incoming HTTP message to Message object and place it on the IncomingMessage object
   *
   * @param {express.IncomingMessage} req Express request object
   * @param {express.OutgoingMessage} res Express response object
   * @param {Function} next Trigger the next middleware
   * @private
   */
  _msgParser(req, res, next) {
    // Fetch request ID from the header if exist
    let requestId = req.header('x-request-id')

    // Construct the Message object
    let msg = new Message(req.body, requestId)

    // Please the request ID on the response header for chaining ID to the next call
    res.header('x-request-id', msg.id)

    // Emit internal event with the parsed message
    this.emit('messageParsed', msg)

    // Place Message object on the IncomingMessage object
    req.msg = msg
    next()
  }

}
