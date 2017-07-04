/**
 * Created by ron on 7/4/2017.
 */

const kc = require('kebab-case')

/**
 * List of registry methods available for services
 *
 * @type {{REGISTER, UNREGISTER, GET_SERVICE, EVENTS}}
 */
module.exports = {
  REGISTER: kc('__register'),
  UNREGISTER: kc('__unRegister'),
  GET_SERVICE: kc('__getService'),
  EVENTS: kc('__eventsBroadcaster')
}