/**
 * Created by Ron on 05/07/2017.
 */

/**
 * A simple array with a function that returns the elements within the array using Round-Robin algorithm
 */
class RoundRobinList extends Array {

    getNext() {
        if (this.nextIndex === undefined) {
            this.nextIndex = 0
        }
        let value = this[this.nextIndex]
        this.nextIndex++
        if (this.nextIndex >= this.length) {
            this.nextIndex = 0
        }
        return value
    }

}

module.exports = RoundRobinList