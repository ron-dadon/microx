/**
 * Created by Ron on 03/07/2017.
 */

const uuidV4 = require('uuid/v4')

/**
 * A simple wrapper for uuid v4 module that strips the dashes from the uuid string
 *
 * @returns {*}
 */
module.exports = function uuid() {
  'use strict'
  return uuidV4().replace(/\-/g, '')
}