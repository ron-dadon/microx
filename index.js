/**
 * Created by Ron on 03/07/2017.
 */

const RegistryParams = require('./src/registry/registry-params')
const Registry = require('./src/registry/registry')
const Service = require('./src/service')

let rp = new RegistryParams(5005)
let r = new Registry()
let s1 = new Service('s1', '1.0', 5006, undefined, false, rp)
let s2 = new Service('s1', '1.1', 5007, undefined, false, rp)
let s3 = new Service('s2', '1.0', 5008, undefined, false, rp)

r.listen(5005)

setTimeout(() => {
  s3.provide('sum', (msg, reply) => {
    let data = msg.data
    reply(null, {sum: data.x + data.y})
  })
  s1.start()
  s2.start()
  s3.start()
}, 1000)

setTimeout(() => {
  s1.call('s2@1.0::sum', {x: 1, y: 2}).then(console.log).catch(console.error)
}, 2000)
