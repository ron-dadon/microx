/**
 * Created by Ron on 03/07/2017.
 */

const uuid = require('./uuid')

/**
 * Event meta data object
 */
class EventMeta {

  constructor(emitter, emitterId, time) {
    this.emitter = emitter
    this.emitterId = emitterId
    this.time = time || Date.now()
  }

}

/**
 * An event object
 */
class Event {

  /**
   * Construct an event object
   *
   * @param {String} name Name of event
   * @param {Object} data Data attached to the event
   * @param {EventMeta} meta
   */
  constructor(name, data, meta) {
    if (typeof name === 'object') {
      Object.assign(this, name)
    } else {
      this.id = uuid()
      this.name = name
      this.data = data
      this.meta = meta || new EventMeta()
    }
  }

}

/**
 * A multicast event object
 */
class MulticastEvent {

  /**
   * Construct a multicast event object
   *
   * @param {String} name Name of event
   * @param {Object} data Data attached to the event
   * @param {String} sourceId The source service ID
   */
  constructor(name, data, sourceId) {
    if (typeof name === 'object') {
      Object.assign(this, name)
    } else {
      this.id = uuid()
      this.name = name
      this.data = data
      this.sourceId = sourceId
    }
  }

}

module.exports = {
  Event: Event,
  EventMeta: EventMeta,
  MulticastEvent: MulticastEvent,
}