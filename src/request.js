/**
 * Created by ron on 7/4/2017.
 */

const request = require('request')

/**
 * Promise wrapper for request module
 * @param options
 * @returns {Promise}
 */
module.exports = function(options) {
  return new Promise((res, rej) => {
    request(options, (err, response) => {
      if (err) return rej(err)
      return res(response)
    })
  })
}
