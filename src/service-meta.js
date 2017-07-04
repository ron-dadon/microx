/**
 * Created by ron on 7/4/2017.
 */

const uuid = require('./uuid')

module.exports = class ServiceMeta {

  constructor(name, version, port, host, secure, id) {
    if (!/^([a-z0-9]+)$/i.test(name)) throw new Error('Service name must contain alphanumeric characters only')
    if (!/^([0-9\.]+)$/i.test(version)) throw new Error('Service version format invalid')
    this.id = id || uuid()
    this.versionName = name + '@' + version
    this.name = name
    this.version = version
    this.port = port
    this.host = host || '127.0.0.1'
    this.url = 'http' + (secure ? 's' : '') + '://' + this.host + ':' + (this.port || (secure ? 443 : 80))
    this.secure = secure
  }

}