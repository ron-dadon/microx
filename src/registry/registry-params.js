/**
 * Created by ron on 7/4/2017.
 */

module.exports = class RegistryParams {

  constructor(port, host, secure) {
    this.port = port || 9000
    this.host = host || '127.0.0.1'
    this.secure = !!secure
  }

  getUrl() {
    return (this.secure ? 'https://' : 'http://') + this.host + ':' + this.port
  }

}
