/**
 * Created by ron on 7/4/2017.
 */

const RegistryMethods = require('./registry-methods')
const Server = require('../rpc/server')
const request = require('../request')
const ServiceMeta = require('../service-meta')

module.exports = class Registry {

  constructor() {
    this.services = {}
    this.events = {}
    this.server = new Server()
    this.server.provide(RegistryMethods.REGISTER, this._register.bind(this))
    this.server.provide(RegistryMethods.UNREGISTER, this._unregister.bind(this))
    this.server.provide(RegistryMethods.GET_SERVICE, this._getService.bind(this))
    this.server.provide(RegistryMethods.EVENTS, this._events.bind(this))
  }

  /**
   * Start the registry server
   *
   * @param {Number} port Port number
   * @param {String} host Host address
   */
  listen(port, host) {
    this.server.listen(port, host)
  }

  /**
   * Register a service in the system
   *
   * @param {Message} msg The registration message
   * @param {Function<Error, Object>} reply The reply function
   * @private
   */
  _register(msg, reply) {
    let service = new ServiceMeta(msg.data.name, msg.data.version, msg.data.port, msg.data.host, msg.data.secure)
    if (!this.services[service.versionName]) {
      this.services[service.versionName] = []
    }
    this.services[service.versionName].push(service)
    reply(null, service)
  }

  /**
   * Unregister a service from the system
   *
   * @param {Message} msg The message with the details of the service to un-register
   * @param {Function<Error, Object>} reply The reply function
   * @private
   */
  _unregister(msg, reply) {
    let name = msg.data.versionName
    let id = msg.data.id
    if (this.services[name]) {
      let serviceInstance
      this.services[name] = this.services[name].filter((service) => {
        serviceInstance = Object.assign({}, service)
        return service.id !== id
      })
      reply(null, serviceInstance)
    }
    reply(new Error('Service is not registered'))
  }

  /**
   * Get instance of a service
   *
   * @param {Message} msg The message with the details of the service
   * @param {Function<Error, Object>} reply The reply function
   * @private
   */
  _getService(msg, reply) {
    let name = msg.data.name
    if (!this.services[name]) return reply(new Error('Service not found'))
    let index = Math.floor(Math.random() * this.services[name].length)
    reply(null, this.services[name][index])
  }

  /**
   * Handle events delegation
   * All events sent to this method by the services will emit to all other services
   *
   * @param {Message} msg The message with the event data
   * @param {Function<Error, Object>} reply The reply function
   * @private
   */
  _events(msg, reply) {
    let event = msg.data
    let emit = this._emitEvent
    for (let service in this.services) {
      if (!this.services.hasOwnProperty(service)) continue
      this.services[service].forEach((s) => {
        let url = s.url
        emit(event, url).then(console.log).catch(console.error)
      })
    }
    reply()
  }

  /**
   * Emit a single event to a single service instance
   *
   * @param {Event} event The event to emit
   * @param {String} url The URL of the target service
   * @returns {Promise<Boolean, Error>}
   * @private
   */
  _emitEvent(event, url) {
    return request({
      url: url + '/__events',
      method: 'POST',
      json: true,
      body: event
    }).then((response) => {
      if (response.statusCode !== 204) {
        let err = new Error('Event was not sent')
        err.statusCode = response.statusCode
        return Promise.reject(err)
      }
      return true
    }).catch(() => {})

  }

}
