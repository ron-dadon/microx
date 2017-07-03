/**
 * Created by Ron on 03/07/2017.
 */

const Server = require('./src/server')

let s = new Server()

s.on('listening', console.log)

s.provide('sum', (msg, reply) => {
  'use strict'
  reply(null, {sum: msg.data.x + msg.data.y})
})

s.react('test', (event) => {
  'use strict'
  console.log(event)
})

s.listen(5000)