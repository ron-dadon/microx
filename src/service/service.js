/**
 * Created by ron on 7/4/2017.
 */

const ServiceMeta = require('./service-meta')
const RegistryMethods = require('./../registry/registry-methods')
const Client = require('./../rpc/client')
const Server = require('./../rpc/server')

module.exports = class Service {

  constructor(name, version, port, host, secure, registryParams) {
    this.meta = new ServiceMeta(name, version, port, host, secure)
    this.registryParams = registryParams
    this.server = new Server()
    this.client = new Client(this.registryParams)
  }

  start() {
    this.server.listen(this.meta.port, this.meta.host)
    return this.client.call('registry::' + RegistryMethods.REGISTER, this.meta)
  }

  provide(method, handler) {
    this.server.provide(method, handler)
  }

  call(method, data, parentMessage) {
    return this.client.call(method, data, parentMessage)
  }

  broadcast(event, data) {
    return this.client.broadcast(event, data, this.meta.versionName)
  }

  react(event, handler) {
    this.server.react(event, handler)
  }

}