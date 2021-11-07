// import { Document } from 'mongoose'
import { sanitize } from 'mongodb-sanitize'
import { Configmodel } from '../modules/models'
import type MyClient from './Client'

interface RawConfig {
  _id: string
  prefix: string
  color: string
  todochannel: string
  readonlychannel: string
  blackboard: {
    channel: string
    message: string
  }
  userroles: string[]
  staffroles: string[]
  tags: Map<string, any>
  blacklist_channels: string[]
  blacklist_users: string[]
  vars: Map<string, any>
  lang: string
  autopurge: boolean
  todomode: string
}

export default class ConfigManager {
  private _client: MyClient

  constructor(client) {
    this._client = client
  }

  /**
   * set
   * @param {RawConfig} configobj Configobject
   * Takes in the config object and sets it
   * to the db.
   *
   * Invalidates cached version of configobj
   * when called
   */
  async set(configobj: RawConfig) {
    const newconf = new Configmodel(sanitize(configobj))
    const cache = await this._client.getAsync(configobj._id)
    if (cache !== null) {
      this._client.cache.del(configobj._id, (err) => {
        if (!err) {
          // eslint-disable-next-line @typescript-eslint/no-shadow
          this._client.cache.set(configobj._id, JSON.stringify(configobj), (err) => {
            if (err) this._client.logger.debug(err)
          })
        }
      })
    }
    return newconf.save()
  }

  async get(_id: string): Promise<RawConfig> {
    const cache = await this._client.getAsync(_id)
    if (cache) return JSON.parse(cache)
    const docs = await Configmodel.findOne({ _id })
    if (docs) this._client.cache.set(_id, JSON.stringify(docs))
    // @ts-expect-error
    return docs
  }

  update(_id: string, configobj) {
    Configmodel.updateOne({ _id }, sanitize(configobj), null, (err) => {
      if (err) this._client.logger.debug(err)
      this._client.util.get('invalidateCache')(_id)
    })
  }
}

export type { RawConfig }
