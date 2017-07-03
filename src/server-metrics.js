/**
 * Created by Ron on 03/07/2017.
 */

module.exports = class ServerMetrics {

  constructor() {
    this.requests = 0
    this.events = 0
    this.errors = 0
    this.upTime = 0
    this.startedAt = null
    this.lastPing = null
    this.lastHealthCheck = null
  }

}
