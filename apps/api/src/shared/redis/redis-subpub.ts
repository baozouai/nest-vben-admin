import { Logger } from '@nestjs/common'
import IORedis from 'ioredis'
import type { Redis, RedisOptions } from 'ioredis'

export class RedisSubPub {
  private logger = new Logger(RedisSubPub.name)

  public pubClient: Redis
  public subClient: Redis
  constructor(
    private redisConfig: RedisOptions,
    private channelPrefix: string = 'm-shop-channel#',
  ) {
    this.init()
  }

  public init() {
    const redisOptions: RedisOptions = {
      host: this.redisConfig.host,
      port: this.redisConfig.port,
    }

    if (this.redisConfig.password)
      redisOptions.password = this.redisConfig.password

    const pubClient = new IORedis(redisOptions)
    const subClient = pubClient.duplicate()
    this.pubClient = pubClient
    this.subClient = subClient
  }

  public async publish(event: string, data: any) {
    const channel = this.channelPrefix + event
    const _data = JSON.stringify(data)
    if (event !== 'log')
      this.logger.debug(`发布事件：${channel} <- ${_data}`)

    await this.pubClient.publish(channel, _data)
  }

  private ctc = new WeakMap<Function, (channel: string, message: string) => void>()

  public async subscribe(event: string, callback: (data: any) => void) {
    const myChannel = this.channelPrefix + event
    this.subClient.subscribe(myChannel)

    const cb = (channel: string, message: string) => {
      if (channel === myChannel) {
        if (event !== 'log')
        this.logger.debug(`接收事件：${channel} -> ${message}`)

        callback(JSON.parse(message))
      }
    }

    this.ctc.set(callback, cb)
    this.subClient.on('message', cb)
  }

  public async unsubscribe(event: string, callback: (data: any) => void) {
    const channel = this.channelPrefix + event
    this.subClient.unsubscribe(channel)
    const cb = this.ctc.get(callback)
    if (cb) {
      this.subClient.off('message', cb)

      this.ctc.delete(callback)
    }
  }
}
