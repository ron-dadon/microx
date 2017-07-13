/**
 * Created by ron on 7/4/2017.
 */

const EventEmitter = require('events')

const Redis = require('ioredis')

const ServiceMeta = require('./service-meta')
const ServiceMetrics = require('./server-metrics')
const Client = require('./../rpc-client')
const Server = require('./../rpc-server')
const Event = require('./../event').Event
const EventMeta = require('./../event').EventMeta
const MulticastEvent = require('./../event').MulticastEvent
const RoundRobinMap = require('./../round-robin-map')

const FrameworkEvents = {
  BROADCAST: '__broadcast',
  STOPPED: '__stopped'
}

const FrameworkCalls = {
  EVENT: '__event'
}

const EVENTS = {
  SERVICE_START: 'service start',
  SERVICE_STOPPED: 'service stopped',
  SERVICE_PING: 'service ping',
  CALL_SERVICE_ERROR: 'call service error',
  CALL_UNKNOWN_SERVICE: 'call unknown service',
  RPC_SERVER_STARTED: 'rpc server started',
  RPC_SERVER_ERROR: 'rpc server error',
  RPC_SERVER_STOPPED: 'rpc server stopped',
  SERVICE_REMOVE_ERROR: 'service remove error',
  SERVICE_REMOVE_SENT: 'service remove sent',
  SERVICE_REMOVED: 'service removed',
  SERVICE_MESSAGE: 'service message',
  SERVICE_CLEAN: 'services clean',
  SERVICE_PING_INTERVAL_STARTED: 'service ping interval started',
  SERVICE_PING_INTERVAL_STOPPED: 'service ping interval stopped',
  SERVICE_PING_SENT: 'service ping sent',
  SERVICE_PING_ERROR: 'service ping error',
}

class Service extends EventEmitter {

  constructor(name, version, port, host, secure, redisConfig) {
    super()
    this.meta = new ServiceMeta(name, version, port, host, secure)
    this.metrics = new ServiceMetrics()
    this.redisConfig = redisConfig
    this.pubClient = new Redis(this.redisConfig)
    this.subClient = new Redis(this.redisConfig)
    this.server = new Server(this)
    this.client = new Client(this)
    this._multicastHandlers = {}
    this._generalMulticastHandler = null
    this.services = {}
    this._multicastRepeater = null

    this.subClient.on('message', _messageHandler.bind(this))

    this._react(FrameworkEvents.BROADCAST, _serviceBroadcastHandler.bind(this))
    this._react(FrameworkEvents.STOPPED, _serviceStoppedHandler.bind(this))

    setTimeout(_cleanServices.bind(this), 5000)

    /**
     * Handle service broadcast event
     *
     * @param {ServiceMeta} meta Meta data of service that broadcast the event
     * @private
     */
    function _serviceBroadcastHandler(meta) {
      if (!this.services[meta.versionName]) {
        this.services[meta.versionName] = new RoundRobinMap()
      }
      meta.lastPing = Date.now()
      this.services[meta.versionName].push(meta.id, meta)
      this.emit(EVENTS.SERVICE_PING, meta)
    }

    /**
     * Handle service stopped event
     *
     * @param {ServiceMeta} meta Meta data of service that broadcast the event
     * @private
     */
    function _serviceStoppedHandler(meta) {
      if (this.services[meta.versionName]) {
        this.services[meta.versionName].remove(meta.id)
        if (this.services[meta.versionName].count() === 0) {
          delete this.services[meta.versionName]
        }
        this.emit(EVENTS.SERVICE_REMOVED, meta)
      }
    }

    /**
     * Handler redis messages
     *
     * @param {String} event Event name
     * @param {MulticastEvent} data Event data
     * @private
     */
    function _messageHandler(event, data) {

      // Parse the string to an object
      data = JSON.parse(data)

      // Emit service message event
      this.emit(EVENTS.SERVICE_MESSAGE, data)

      // Ignore self events
      if (data.sourceId === this.meta.id) return

      // Handle by general multicast handler if exists
      if (this._generalMulticastHandler) {
        this._generalMulticastHandler(data.data)
      }

      // Handle the event if a specific listener exists
      if (this._multicastHandlers[event]) {
        this._multicastHandlers[event](data.data)
      }

    }

    /**
     * Clean the services map from redundant services
     * The function will be called every 5 seconds from the first call
     *
     * @private
     */
    function _cleanServices() {
      for (let serviceCollection in this.services) {
        if (!this.services.hasOwnProperty(serviceCollection)) continue
        for (let serviceId in this.services[serviceCollection].items) {
          if (!this.services[serviceCollection].items.hasOwnProperty(serviceId)) continue
          let ttl = this.services[serviceCollection].items[serviceId].ttl * 1000
          if (Date.now() - this.services[serviceCollection].items[serviceId].lastPing > ttl) {
            delete this.services[serviceCollection].items[serviceId]
          }
        }
        if (this.services[serviceCollection].count() === 0) {
          delete this.services[serviceCollection]
        }
      }
      this.emit(EVENTS.SERVICE_CLEAN, this.services)
      setTimeout(_cleanServices.bind(this), 5000)
    }

  }

  start() {

    // Start RPC server
    this.server.start()
      .then((function() {
        this.emit(EVENTS.RPC_SERVER_STARTED)
      }).bind(this))
      .catch((function(err) {
        this.emit(EVENTS.RPC_SERVER_ERROR, err)
      }).bind(this))

    // Send service ping and initialize pinging interval
    this._multicast(FrameworkEvents.BROADCAST, this.meta)
      .then(emitSent.bind(this))
      .catch(emitError.bind(this))

    let interval = Math.ceil(this.meta.ttl * 500)

    this.emit(EVENTS.SERVICE_PING_INTERVAL_STARTED, interval)

    this._multicastRepeater = setInterval((function() {
      this._multicast(FrameworkEvents.BROADCAST, this.meta)
        .then(emitSent.bind(this))
        .catch(emitError.bind(this))
    }).bind(this), interval)

    this.emit(EVENTS.SERVICE_START)

    return this

    function emitSent() {
      this.emit(EVENTS.SERVICE_PING_SENT, this.meta)
    }

    function emitError(err) {
      this.emit(EVENTS.SERVICE_PING_ERROR, err)
    }

  }

  stop() {
    clearInterval(this._multicastRepeater)
    this.emit(EVENTS.SERVICE_PING_INTERVAL_STOPPED)

    this._multicast(FrameworkEvents.STOPPED, this.meta).then((function() {
      this.emit(EVENTS.SERVICE_REMOVE_SENT, this.meta)

      this.server.stop()
      this.emit(EVENTS.RPC_SERVER_STOPPED)

      try {
        this.pubClient.disconnect()
        this.subClient.disconnect()
      } catch (e) {
        // TODO: handle error
      }

      this.emit(EVENTS.SERVICE_STOPPED)
    }).bind(this), (function() {
      this.emit(EVENTS.SERVICE_REMOVE_ERROR, this.meta)
      this.emit(EVENTS.SERVICE_STOPPED)
    }).bind(this))
  }

  provide(method, handler) {
    this.server.provide(method, handler)
    return this
  }

  /**
   * Call another service
   * Use round robin load balance to select the target instance
   *
   * @param {String} service Full name of the service (including version)
   * @param {String} method Method name
   * @param {Object} [data] Data to send
   * @param {Message} [parentMessage] Parent message in case of cascaded calls for request tracking
   *
   * @returns {Promise}
   */
  call(service, method, data, parentMessage) {

    // Check if service exists
    if (!this.services[service]) {
      let err = new Error('Unknown service')
      this.emit(EVENTS.CALL_UNKNOWN_SERVICE, service, method, err)
      return Promise.reject(err)
    }

    // Get the next round-robin instance
    let instance = this.services[service].getNext()
    if (!instance) {
      let err = new Error('Unknown service')
      this.emit(EVENTS.CALL_SERVICE_ERROR, service, method, err)
      return Promise.reject(err)
    }

    // Perform the call
    return this.client.call(instance.url, method, data, parentMessage)
  }

  /**
   * Boradcast an event to the other services
   *
   * @param event
   * @param data
   */
  broadcast(event, data) {
    // Construct event object
    let eventMeta = new EventMeta(this.meta.versionName, this.meta.id)
    let eventObj = new Event(event, data, eventMeta)

    // Go over all the services and broadcast to all of them
    for (let serviceCollection in this.services) {
      if (!this.services.hasOwnProperty(serviceCollection)) continue
      this.call(serviceCollection, FrameworkCalls.EVENT, eventObj)
    }
  }

  /**
   * Register a service event listener
   *
   * @param {String} event Event name
   * @param {Function} handler Event handler function, signature (Event)
   * @returns {Service} Returns the service instance for method chaining
   */
  onEvent(event, handler) {
    // Assign server event handler
    this.server.onEvent(event, handler)
    return this
  }

  /**
   * Broadcast a multicast event via redis publish client
   *
   * @param {String} event Event name
   * @param {Object} data Event data
   * @returns {Promise}
   * @private
   */
  _multicast(event, data) {

    // Construct multicast event object
    let e = new MulticastEvent(event, data, this.meta.id)

    // Publish the event to the event channel and return a promise with the number of subscribers that got the message
    return new Promise((res, rej) => {
      this.pubClient.publish(event, JSON.stringify(e), (err, result) => {
        if (err) {
          return rej(err)
        }
        res(result)
      })
    })
  }

  /**
   * React to a multicast event
   *
   * @param {String} event Event name
   * @param {Function} handler Event handler function
   * @private
   */
  _react(event, handler) {
    this._multicastHandlers[event] = handler
    this.subClient.subscribe(event)
  }

  /**
   * React to all multicast events
   *
   * @param {Function} handler General event handler function
   * @private
   */
  _reactAll(handler) {
    this._generalMulticastHandler = handler
    this.subClient.psubscribe('*')
  }

}

Service.EVENTS = EVENTS

module.exports = Service