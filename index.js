/**
 * Created by Ron on 03/07/2017.
 */

const RegistryParams = require('./src/registry/registry-params')
const Registry = require('./src/registry/registry')
const Service = require('./src/service/service')

let rp = new RegistryParams(5005)
let r = new Registry()
let s1 = new Service('s1', '1.0', 5006, undefined, false, rp)
let s11 = new Service('s1', '1.0', 5009, undefined, false, rp)
let s2 = new Service('s1', '1.1', 5007, undefined, false, rp)
let s3 = new Service('s2', '1.0', 5008, undefined, false, rp)

r.listen(5005)

setTimeout(() => {
  s2.provide('sum', (msg, reply) => {
    let data = msg.data
    s2.call('s2@1.0::sum', {x: 1, y: 2}, msg).then((replyMsg) => {
      "use strict";
      let data2 = replyMsg.data
      s2.broadcast('e2', replyMsg)
      reply(null, {sum: data.x + data.y + data2.sum, tag: 'second call'})
    }).catch((err) => {
      "use strict";
      reply(err)
    })
  })
  s3.provide('sum', (msg, reply) => {
    let data = msg.data
    reply(null, {sum: data.x + data.y, tag: 'a'})
  })

  s2.react('e1', console.log)
  s3.react('e1', console.log)
  s3.react('e2', console.log)

  s1.start().then(() => {
    "use strict";
    console.log('Service s1 started')
  }).catch(console.error)
  s11.start().then(() => {
    "use strict";
    console.log('Service s11 started')
  }).catch(console.error)
  s2.start().then(() => {
    "use strict";
    console.log('Service s2 started')
  }).catch(console.error)
  s3.start().then(() => {
    "use strict";
    console.log('Service s3 started')
  }).catch(console.error)
}, 1000)

setTimeout(() => {
  // s1.call('s2@1.0::sum', {x: 1, y: 2}).then(console.log).catch(console.error)
  s1.call('s1@1.1::sum', {x: 1, y: 2}).then(console.log).catch(console.error)
}, 2000)
