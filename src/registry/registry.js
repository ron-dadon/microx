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
    this.events = []
    this.server = new Server()
    this.server.provide(RegistryMethods.REGISTER, this._register.bind(this))
    this.server.provide(RegistryMethods.UNREGISTER, this._unregister.bind(this))
    this.server.provide(RegistryMethods.GET_SERVICE, this._getService.bind(this))
    this.server.provide(RegistryMethods.EVENTS, this._events.bind(this))
  }

  listen(port, host) {
    this.server.listen(port, host)
  }

  _register(msg, reply) {
    let service = new ServiceMeta(msg.data.name, msg.data.version, msg.data.port, msg.data.host, msg.data.secure)
    if (!this.services[service.versionName]) {
      this.services[service.versionName] = []
    }
    this.services[service.versionName].push(service)
    reply(null, service)
  }

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

  _getService(msg, reply) {
    let name = msg.data.name
    if (!this.services[name]) return reply(new Error('Service not found'))
    let index = Math.floor(Math.random() * this.services[name].length)
    reply(null, this.services[name][index])
  }


  _events(msg, reply) {
    let event = msg.data
    let emit = this._emitEvent
    for (let service in this.services) {
      if (!this.services.hasOwnProperty(service)) continue
      this.services[service].forEach((s) => {
        let url = s.url
        emit(event).then(console.log).catch(console.error)
      })
    }
  }

  _emitEvent(event, url) {
    request({
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
    })

  }

}
