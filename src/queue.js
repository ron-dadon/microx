/**
 * Created by Ron on 05/07/2017.
 */

/**
 * Implementation of a queue using a simple array
 */
class Queue {

  constructor() {
    this.items = []
  }

  push(item) {
    this.items.unshift(item)
  }

  peek() {
    if (!this.items.length) return null
    return this.items[0]
  }

  pop() {
    return this.items.pop()
  }

  length() {
    return this.items.length
  }

}

module.exports = Queue