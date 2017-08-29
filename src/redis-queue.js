/**
 * Created by Ron on 05/07/2017.
 */

const Redis = require('ioredis')
const uuid = require('./uuid')

/**
 * Implementation of a queue using redis
 */

class RedisQueue {

  constructor(service, listKey) {
    this._redis = new Redis(service.redisConfig || {})
    this._listKey = listKey || uuid()
  }

  push(item, listKey) {
    let _redis = this._redis
    let _key = listKey || this._listKey

    return new Promise((res, rej) => {
      _redis.lpush(_key, JSON.stringify(item), (err, result) => {
        if (err) return rej(err)
        return res(result)
      })
    })
  }

  peek(listKey) {
    let _redis = this._redis
    let _key = listKey || this._listKey

    return new Promise((res, rej) => {
      _redis.lindex(_key, 0, (err, result) => {
        if (err) {
          return rej(err)
        }
        return res(result ? JSON.parse(result) : null)
      })
    })
  }

  pop(listKey) {
    let _redis = this._redis
    let _key = listKey || this._listKey

    return new Promise((res, rej) => {
      _redis.rpop(_key, (err, result) => {
        if (err) {
          return rej(err)
        }
        return res(result ? JSON.parse(result) : null)
      })
    })
  }

  length(listKey) {
    let _redis = this._redis
    let _key = listKey || this._listKey

    return new Promise((res, rej) => {
      _redis.llen(_key, (err, result) => {
        if (err) {
          return rej(err)
        }
        return res(result)
      })
    })
  }

  toArray(listKey) {
    let _redis = this._redis
    let _key = listKey || this._listKey

    return new Promise((res, rej) => {
      _redis.lrange(_key, 0, -1, (err, results) => {
        if (err) {
          return rej(err)
        }
        return res(results.map(JSON.parse))
      })
    })
  }

}

module.exports = RedisQueue