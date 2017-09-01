/**
 * Created by ron on 7/4/2017.
 */

const EventEmitter = require('events')

const Redis = require('ioredis')
const request = require('request')
const semver = require('semver')

const ServiceMeta = require('./service-meta')
const ServiceMetrics = require('./server-metrics')
const Client = require('./../rpc-client')
const Server = require('./../rpc-server')
const Event = require('./../event').Event
const EventMeta = require('./../event').EventMeta
const MulticastEvent = require('./../event').MulticastEvent
const RoundRobinMap = require('./../round-robin-map')
const Queue = require('./../redis-queue')
const Message = require('../message')

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
  SERVICE_PING_ERROR: 'service ping error'
}

class ServiceConfiguration {

  constructor(opt) {

    if (!opt.name) {
      throw new Error('Service name is required')
    }

    this.name = opt.name || ''
    this.version = opt.version || '1.0.0'
    this.port = parseInt(opt.port || 8080)
    this.host = opt.host || 'localhost'
    this.secure = !!(opt.secure || false)
    this.redisConfig = opt.redisConfig || {}

    if (!semver.valid(this.version)) {
      throw new Error('Invalid version. Version must follow semantic version specifications')
    }

  }

}

class Service extends EventEmitter {

  constructor(opt) {
    super()
    // Make sure opt is a service configuration object
    if (!(opt instanceof ServiceConfiguration)) {
      opt = new ServiceConfiguration(opt)
    }
    this.meta = new ServiceMeta(opt.name, opt.version, opt.port, opt.host, opt.secure)
    this.metrics = new ServiceMetrics()
    this.redisConfig = opt.redisConfig
    this.pubClient = new Redis(this.redisConfig)
    this.subClient = new Redis(this.redisConfig)
    this.server = new Server(this)
    this.client = new Client(this)
    this._multicastHandlers = {}
    this._generalMulticastHandler = null
    this.services = {}
    this._defaultVersions = {}
    this.servicesEvents = {}
    this._multicastRepeater = null
    this._mockupMethods = {}

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
      if (this._defaultVersions[meta.name]) {
        if (semver.gt(meta.version, this._defaultVersions[meta.name])) {
          this._defaultVersions[meta.name] = meta.version
        }
      } else {
        this._defaultVersions[meta.name] = meta.version
      }
      this.services[meta.versionName].push(meta.id, meta)
      if (!this.servicesEvents[meta.versionName]) {
        this.servicesEvents[meta.versionName] = new Queue(this)
      }
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
          delete this.servicesEvents[meta.versionName]
          delete this._defaultVersions[meta.name]
        }
        this.emit(EVENTS.SERVICE_REMOVED, meta)
        _cleanServices.call(this)
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
        // Disable removal of service from the list, to preserve events
        // if (this.services[serviceCollection].count() === 0) {
        //   delete this.services[serviceCollection]
        //   delete this.servicesEvents[serviceCollection]
        // }
      }
      _updateVersions.call(this)
      this.emit(EVENTS.SERVICE_CLEAN, this.services)
      setTimeout(_cleanServices.bind(this), 5000)
    }

    function _updateVersions() {
      this._defaultVersions = {}
      for (let serviceCollection in this.services) {
        if (!this.services.hasOwnProperty(serviceCollection)) continue
        let serviceSegments = serviceCollection.split('@')
        if (!this._defaultVersions[serviceSegments[0]]) {
          this._defaultVersions[serviceSegments[0]] = serviceSegments[1]
        }
        if (semver.gt(serviceSegments[1], this._defaultVersions[serviceSegments[0]])) {
          this._defaultVersions[serviceSegments[0]] = serviceSegments[1]
        }
      }

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

  /**
   * Provide a method via the service
   *
   * @param {String|Object} method The method name or an object that provide a mapping from method names to handler functions
   * @param {...Function} [handler] The method handler or list of middleware followed by handler
   * @returns {Service}
   */
  provide(method, handler) {
    if (typeof method === 'object') {
      for (let methodName in method) {
        if (method.hasOwnProperty(methodName) && typeof method[methodName] === 'function') {
          this.server.provide(methodName, method[methodName])
        }
      }
    } else {
      this.server.provide.apply(this.server, Array.from(arguments))
    }
    return this
  }

  /**
   * An alias for provide
   *
   * @param {String|Object} method The method name or an object that provide a mapping from method names to handler functions
   * @param {...Function} [handler] The method handler or list of middleware followed by handler
   * @returns {Service}
   */
  method(method, handler) {
    return this.provide.apply(this, Array.from(arguments))
  }

  /**
   * Provide a middleware to run before a method is executed
   *
   * @param {Function} mw the middleware function in the format of (msg, next)
   *
   * @returns {Service}
   */
  use(mw) {
    this.server.use(mw)
    return this
  }

  /**
   * Mockup another service method for development and debugging
   *
   * @param {String} service the name of the service
   * @param {String} method the name of the method
   * @param {Function} handler the handler function
   */
  mockup(service, method, handler) {

    // Use default version if no version is set
    // The default version will be the latest version or fallback to 1.0.0
    if (service.indexOf('@') < 0) {
      service += '@' + (this._defaultVersions[service] || '1.0.0')
    }

    this._mockupMethods[service + '#' + method] = handler
  }

  /**
   * Alias for mockup method
   *
   * @param {String} service the name of the service
   * @param {String} method the name of the method
   * @param {Function} handler the handler function
   */
  mock(service, method, handler) {
    return this.mockup(service, method, handler)
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

    // Use default version if no version is set
    // The default version will be the latest version or fallback to 1.0.0
    if (service.indexOf('@') < 0) {
      service += '@' + (this._defaultVersions[service] || '1.0.0')
    }

    // Check if mockup method is defined
    if (this._mockupMethods[service + '#' + method]) {
      let msg = new Message(data, parentMessage ? parentMessage.headers || {} : {}, this.meta.versionName)
      let mockup = this._mockupMethods[service + '#' + method]
      let $this = this
      return new Promise((res, rej) => {
        mockup(msg, function(err, data) {
          if (err) {
            return rej(err)
          }
          let replyMsg = new Message(data, parentMessage ? parentMessage.headers || {} : {}, service)
          res(replyMsg)
        }, $this)
      })
    }

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
   * A wrapper for request module
   * Returns a promise
   *
   * @param {Object} options Request module options
   * @returns {Promise}
   */
  httpRequest(options) {
    return new Promise((res, rej) => {
      request(options, (err, response) => {
        if (err) return rej(err)
        return res(response)
      })
    })
  }

  /**
   * Broadcast an event to the other services
   *
   * @param {String} event The name of the event
   * @param {Object} data The event payload object
   */
  broadcast(event, data) {
    if (event.indexOf(this.meta.name + '.') !== 0) {
      event = this.meta.name + '.' + event
    }
    // Construct event object
    let eventMeta = new EventMeta(this.meta.versionName, this.meta.id)
    let eventObj = new Event(event, data, eventMeta)

    // Go over all the services and broadcast to all of them
    for (let serviceCollection in this.servicesEvents) {
      if (!this.servicesEvents.hasOwnProperty(serviceCollection)) continue
      this.servicesEvents[serviceCollection].push(eventObj)
    }

    process.nextTick(this._processEvent.bind(this))

  }

  /**
   * Subscribe to an event
   *
   * @param {String} event Event name
   * @param {Function} handler Event handler function, signature (Event)
   * @returns {Service} Returns the service instance for method chaining
   */
  subscribe(event, handler) {
    // Assign server event handler
    this.server.onEvent(event, handler)
    return this
  }

  /**
   * Return an array of all known services
   *
   * @returns {Array}
   */
  getServices() {
    let list = []
    for (let service in this.services) {
      if (!this.services.hasOwnProperty(service)) continue
      list = list.concat(this.services[service].toArray())
    }
    return list;
  }

  /**
   * Return the pending events queues
   *
   * @returns {{}|*}
   */
  getEventsQueues() {
    let list = {}
    for (let service in this.servicesEvents) {
      if (!this.servicesEvents.hasOwnProperty(service)) continue
      list[service] = this.servicesEvents[service].toArray()
    }
    return this.servicesEvents
  }

  /**
   * Get updated metrics data
   *
   * @returns {ServiceMetrics}
   */
  getMetrics() {
    this.metrics.upTime = Date.now() - this.metrics.startedAt
    return this.metrics
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
    let metrics = this.metrics
    // Publish the event to the event channel and return a promise with the number of subscribers that got the message
    return new Promise((res, rej) => {
      this.pubClient.publish(event, JSON.stringify(e), (err, result) => {
        if (err) {
          return rej(err)
        }
        metrics.lastMulticast = Date.now()
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

  /**
   * Process an event and broadcast it to all the services
   *
   * @private
   */
  _processEvent() {

    // let moreEvents = false
    let $this = this

    // Go over all the services and broadcast to all of them
    for (let serviceCollection in this.servicesEvents) {
      if (!this.servicesEvents.hasOwnProperty(serviceCollection)) continue
      this.servicesEvents[serviceCollection].peek().then((event) => {
        if (!event) return null
        return $this.call(serviceCollection, FrameworkCalls.EVENT, event).then(() => {
          $this.servicesEvents[serviceCollection].pop().then(() => {
            process.nextTick($this._processEvent.bind($this))
          })
        })
      }).catch(() => {})
    }

  }

}

Service.EVENTS = EVENTS
Service.ServiceConfiguration = ServiceConfiguration

module.exports = Service