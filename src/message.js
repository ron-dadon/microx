/**
 * Created by Ron on 03/07/2017.
 */

const uuid = require('./uuid')

module.exports = class Message {

  constructor(data, id) {
    this.id = id || uuid()
    this.data = data
    this.time = Date.now()
  }

}
