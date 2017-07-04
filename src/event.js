/**
 * Created by Ron on 03/07/2017.
 */

const uuid = require('./uuid')
const kc = require('kebab-case')

module.exports = class Event {

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
    this.name = kc(this.name)
  }

}
