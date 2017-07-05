/**
 * Created by Ron on 03/07/2017.
 */

module.exports = class ServerMetrics {

  constructor() {
    this.methodsCount = 0
    this.eventsCount = 0
    this.pingsCount = 0
    this.healthChecksCount = 0
    this.errorsCount = 0
    this.upTime = 0
    this.startedAt = null
    this.lastPing = null
    this.lastHealthCheck = null
    this.methods = {}
    this.events = {}
    this.errors = {}
  }

}
