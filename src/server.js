/**
 * Created by Ron on 03/07/2017.
 */

const express = require('express')
const jsonParser = require('body-parser').json
const HttpsStatus = require('http-status-codes')
const EventEmitter = require('events')
const ServerMetrics = require('./server-metrics')
const Message = require('./message')
const Event = require('./event')

module.exports = class Server extends EventEmitter {

  constructor() {
    super()
    this.methodHandlers = {}
    this.eventHandlers = {}
    this.metrics = new ServerMetrics()
    this.server = express()
    this.server.use(jsonParser())
    this.server.use(this._metricsMiddleware.bind(this))
    this.server.post('/__healthCheck', this._healthCheckHandler.bind(this))
    this.server.post('/__ping', this._pingHandler.bind(this))
    this.server.post('/__events', this._eventHandler.bind(this))
    this.server.post('/:method', this._methodHandler.bind(this))
    this.server.use(this._errorHandler.bind(this))
  }

  listen(port, host) {
    let emit = this.emit.bind(this)
    let metrics = this.metrics
    this.server.listen(port, host, () => {
      metrics.startedAt = Date.now()
      emit('listening', port, host)
    })
  }

  provide(method, handler) {
    if (typeof handler !== 'function') return false
    method = method.toLowerCase()
    if (['__events', '__ping', '__healthCheck'].indexOf(method) >= 0) return false
    this.methodHandlers[method] = handler
    return true
  }

  react(event, handler) {
    if (typeof handler !== 'function') return false
    event = event.toLowerCase()
    this.eventHandlers[event] = handler
  }

  _healthCheckHandler(req, res) {
    this.metrics.upTime = Date.now() - this.metrics.startedAt
    this.metrics.lastHealthCheck = Date.now()
    res.json(this.metrics)
  }

  _pingHandler(req, res) {
    this.metrics.lastPing = Date.now()
    res.status(HttpsStatus.NO_CONTENT).send()
  }

  _eventHandler(req, res, next) {
    this.metrics.events++
    let event = new Event(req.body)
    res.status(HttpsStatus.NO_CONTENT).send()
    if (typeof this.eventHandlers[event.name] === 'function') {
      this.eventHandlers[event.name](event)
    }
  }

  _methodHandler(req, res, next) {
    let method = req.params.method
    if (!this.methodHandlers[method]) {
      let err = new Error(HttpsStatus.getStatusText(HttpsStatus.METHOD_NOT_ALLOWED))
      err.statusCode = HttpsStatus.METHOD_NOT_ALLOWED
      return next(err)
    }
    let requestId = req.header('x-request-id')
    let parentId = req.header('x-request-parent-id')
    let msg = new Message(req.body, requestId, parentId)
    this.methodHandlers[method](msg, (err, data) => {
      if (err) {
        return next(err)
      }
      let replyMsg = new Message()
      res.header('x-request-id', replyMsg.id)
      res.header('x-request-parent-id', requestId)
      res.json(data)
      next()
    })
  }

  _errorHandler(err, req, res, next) {
    if (!err) return next()
    this.metrics.errors++
    res.status(err.statusCode || 500).json({
      statusCode: err.statusCode || 500,
      message: err.message
    })
  }

  _metricsMiddleware(req, res, next) {
    this.metrics.requests++
    next()
  }

}
