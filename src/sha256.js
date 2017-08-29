/**
 * Created by Ron on 8/29/2017.
 */

const crypto = require('crypto')

module.exports = function sha256(data) {
  const hash = crypto.createHash('sha256')
  hash.update(data)
  return hash.digest('hex')
}
