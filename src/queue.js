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
    return Promise.resolve(this.items.length)
  }

  peek() {
    if (!this.items.length) return Promise.resolve(null)
    return Promise.resolve(this.items[0])
  }

  pop() {
    return Promise.resolve(this.items.pop())
  }

  length() {
    return Promise.resolve(this.items.length)
  }

  toArray() {
    return Promise.resolve(this.items);
  }

}

module.exports = Queue