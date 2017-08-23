/**
 * Created by Ron on 03/07/2017.
 */

const Service = require('./src/service/service')

/**
 * A factory method for creating service instances
 *
 * @param {Object} [opt] options object
 * @returns {Service}
 */
module.exports = function createService(opt) {
  return new Service(new Service.ServiceConfiguration(opt))
}