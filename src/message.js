/**
 * Created by Ron on 03/07/2017.
 */

const uuid = require('./uuid')

class Message {

  constructor(data, id, from) {
    this.id = id || uuid()
    this.data = data
    this.time = Date.now()
    this.from = from
  }

}

module.exports = Message