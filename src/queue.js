/**
 * Created by Ron on 05/07/2017.
 */

module.exports = class Queue {

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
