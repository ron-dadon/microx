/**
 * Created by Ron on 03/07/2017.
 */

/**
 * Holds metrics data for a service instance
 */
class ServiceMetrics {

  constructor() {
    this.requestsCount = 0
    this.eventsCount = 0
    this.errorsCount = 0
    this.upTime = 0
    this.startedAt = null
    this.lastMulticast = null
    this.requests = {}
    this.events = {}
    this.errors = {}
  }

}

module.exports = ServiceMetrics