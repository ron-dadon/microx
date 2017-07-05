/**
 * Created by ron on 7/4/2017.
 */

const request = require('request')
const EventEmitter = require('events')
const RegistryParams = require('../registry/registry-params')
const RegistryMethods = require('../registry/registry-methods')
const uuid = require('../uuid')
const Message = require('../message')
const Event = require('../event')
const kc = require('kebab-case')

module.exports = class Client extends EventEmitter {

  /**
   * Initialize client
   * Setup the registry parameters for retrieving services from the registry
   *
   * @param {RegistryParams} registry Parameters for registry server
   */
  constructor(registry) {
    super();
    this.registry = registry || new RegistryParams()
    this.services = {
      'registry': this.registry.getUrl()
    }
  }

  /**
   * Call a service method
   *
   * @param {String} method Service and method
   * @param {Object} data Data to pass to the method
   * @param {Message} [parentMessage] Parent message in case of multiple / canonical calls
   * @returns {Promise<Message, Error>}
   */
  call(method, data, parentMessage) {
    // Parse method string to parameters
    let callParams = this._parseMethod(method)

    // Get service instance from local cache or from registry
    return this._getService(callParams.service).then((service) => {

      // Perform the method call to the service
      return this._request({
        url: service + '/' + callParams.method,
        method: 'POST',
        body: data,
        json: true,
        headers: {
          'X-Request-ID': parentMessage ? parentMessage.id || undefined : undefined
        }
      }).then((response) => {

        // If service returned an error status, build Error object and reject the promise
        if (response.statusCode >= 400) {
          let err = new Error(response.body ? response.body.message || 'Interval Server Error' : 'Internal Server Error')
          err.statusCode = response.statusCode
          return Promise.reject(err)
        }

        // Resolve the promise with a Message built from the call response
        return new Message(response.body, response.headers['x-request-id'])
      })
    })
  }

  /**
   * Broadcast an event to all other services
   * The event is broadcast to the registry, and the registry broadcasts it to all other services
   *
   * @param {String} event Event name
   * @param {Object} data Event data
   * @param {String} [emitter] Name of emitting service
   * @returns {Promise<Boolean, Error>}
   */
  broadcast(event, data, emitter) {
    // Build Event object
    let e = new Event(event, data, emitter)

    // Get registry URL
    let registry = this.registry.getUrl()

    // Send event to the registry events method
    return this._request({
      url: registry + '/' + RegistryMethods.EVENTS,
      method: 'POST',
      body: e,
      json: true
    }).then((response) => {

      // If response is not 204 NO CONTENT, reject with an error
      if (response.statusCode >= 400) {
        let err = new Error(response.body ? response.body.message || 'Internal Server Error' : 'Internal Server Error')
        err.statusCode = response.statusCode
        return Promise.reject(err)
      }

      // Resolve with true
      return true
    })
  }

  /**
   * Parse service and method string to service & method
   * The input string should be in the format of 'service::method' or 'service@version::method'
   *
   * @param {String} method Service with method string
   * @returns {boolean|{service: String, method: String}} Return false if parsing failed, object with params otherwise
   * @private
   */
  _parseMethod(method) {
    // Validate that the method string is in valid format
    if (!/^([\w\d]+(@[\d\.]+)?)::([\w\d\-_]+)$/i.test(method)) return false

    // Build call parameters object
    let callParameters = {
      service: null,
      method: null
    }

    // Split string by :: to separate service name and method name
    let segments = method.split('::')

    // If segments number is more than one, than first segment is the service
    if (segments.length > 1) {
      callParameters.service = segments[0]
      segments.splice(0, 1)
    }

    // Normalize the method name
    callParameters.method = kc(segments[0])

    // Emit internal event that the method was parsed successfully
    this.emit('methodParsed', callParameters)

    return callParameters
  }

  /**
   * Get the address of a service
   * The function is async because if the service is not known, a round trip to the registry is required
   *
   * @param {String} service Service name
   * @returns {Promise<String>}
   * @private
   */
  _getService(service) {
    // Check if service is known and exists in cache
    if (this.services[service]) {
      return Promise.resolve(this.services[service])
    }

    // Get registry URL
    let registry = this.registry.getUrl()

    // Send event to the registry events method
    return this._request({
      url: registry + '/' + RegistryMethods.GET_SERVICE,
      method: 'POST',
      body: {name: service},
      json: true
    }).then((response) => {

      // If response is not 200 OK, reject with an error
      if (response.statusCode !== 200) {
        let err = new Error(response.body ? response.body.message || 'Internal Server Error' : 'Internal Server Error')
        err.statusCode = response.statusCode
        return Promise.reject(err)
      }

      // Resolve with true
      return response.body.url
    })
  }

  /**
   * Perform HTTP request and return a promise
   *
   * @param {Object} options Request options object
   * @returns {Promise<IncomingMessage,Error>}
   * @private
   */
  _request(options) {
    // Build a new Promise, resolve the promise of the request was successful, reject it with the error if failed
    return new Promise((res, rej) => {
      request(options, (err, response) => {
        if (err) return rej(err)
        res(response)
      })
    })
  }

}