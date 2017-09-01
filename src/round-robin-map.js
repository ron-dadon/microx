/**
 * Created by Ron on 05/07/2017.
 */

/**
 * A simple map with a function that returns the elements within the map using Round-Robin algorithm
 */
class RoundRobinMap {

  constructor() {
    this.items = {}
    this.lastIndex = 0
  }

  push(key, value) {
    this.items[key] = value
  }

  remove(key) {
    if (this.items[key]) {
      delete this.items[key]
    }
  }

  get(key) {
    return this.items[key] || null
  }

  getNext() {
    let values = Object.values(this.items)
    if (!values.length) return null;
    if (this.lastIndex >= values.length) {
      this.lastIndex = 0
    }
    return values[this.lastIndex++]
  }

  count() {
    return Object.keys(this.items).length
  }

  toArray() {
    return Object.values(this.items)
  }
}

module.exports = RoundRobinMap