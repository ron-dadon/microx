/**
 * Created by ron on 7/4/2017.
 */

const uuid = require('../uuid')

class ServiceMeta {

  constructor(name, version, port, host, secure, id, ttl) {
    this.id = id || uuid()
    this.versionName = name + '@' + version
    this.name = name
    this.version = version
    this.port = port || (secure ? 443 : 80)
    this.host = host || '127.0.0.1'
    this.url = 'http' + (secure ? 's' : '') + '://' + this.host + ':' + (this.port || (secure ? 443 : 80))
    this.secure = secure
    this.ttl = ttl || 10
  }

  getUrl() {
    return 'http' + (this.secure ? 's' : '') + '://' + this.host + ':' + (this.port || (this.secure ? 443 : 80))
  }

}

module.exports = ServiceMeta