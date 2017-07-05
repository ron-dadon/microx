/**
 * Created by Ron on 05/07/2017.
 */

module.exports = class RoundRobinList extends Array {

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
