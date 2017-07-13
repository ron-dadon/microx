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
    let keys = Object.keys(this.items)
    let key = keys[this.nextIndex]
    this.nextIndex++
    if (this.nextIndex >= keys.length) {
      this.nextIndex = 0
    }
    return this.get(key)
  }

  count() {
    return Object.keys(this.items).length
  }

  toArray() {
    return Object.values(this.items)
  }
}

module.exports = RoundRobinMap