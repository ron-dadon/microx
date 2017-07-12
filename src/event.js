/**
 * Created by Ron on 03/07/2017.
 */

const uuid = require('./uuid')

class Event {

  constructor(name, data, emitter) {
    if (typeof name === 'object') {
      Object.assign(this, name)
    } else {
      this.id = uuid()
      this.name = name
      this.data = data
      this.time = Date.now()
      this.emitter = emitter
    }
  }

}

module.exports = Event