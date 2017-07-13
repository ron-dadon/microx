/**
 * Created by ron on 7/12/2017.
 */

const request = require('request')

class RpcClient {

  call(url, method, data) {
    return new Promise((res, rej) => {
      request({
        url: [url, method].join('/'),
        method: 'POST',
        body: data,
        json: true
      }, (err, response) => {
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