/**
 * Created by Ron on 03/07/2017.
 */

const uuid = require('./uuid')

/**
 * A message object that passes between services
 */
class Message {

  /**
   * Construct a new message object
   * The message ID will be extracted from the header X-Request-ID or will be generated if such header does not exist
   * The from information will be extracted from the header X-Request-From if from is not provided, or will be null
   *
   * @param {Object} data The message data
   * @param {Object} headers The message headers
   * @param {String} [from] Full service name of the service that constructed the message
   */
  constructor(data, headers, from) {
    this.id = headers['x-request-id'] || uuid()
    this.data = data
    this.headers = headers
    this.time = Date.now()
    this.from = from || headers['x-request-from'] || null
  }

}

module.exports = Message