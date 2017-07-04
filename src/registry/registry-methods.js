/**
 * Created by ron on 7/4/2017.
 */

const kc = require('kebab-case')

module.exports = {
  REGISTER: kc('__register'),
  UNREGISTER: kc('__unRegister'),
  GET_SERVICE: kc('__getService'),
  EVENTS: kc('__events')
}