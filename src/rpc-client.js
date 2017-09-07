/**
 * Created by ron on 7/12/2017.
 */

const request = require('request')

class RpcClient {

  constructor(service) {
    this._service = service
  }

  call(url, method, data, parent, opt) {
    return new Promise((res, rej) => {

      opt = Object.assign({}, this._service._options.requestDefaultOptions, opt, {
        url: [url, method].join('/'),
        headers: parent ? parent.headers : {},
        method: 'POST',
        body: data,
        json: true
      })
      request(opt, (err, response) => {
        if (err) {
          rej(err)
        } else {
          res(response.body)
        }
      })
    })
  }

}

module.exports = RpcClient