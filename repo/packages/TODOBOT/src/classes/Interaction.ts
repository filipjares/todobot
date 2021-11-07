import { GuildMember, MessageEmbed } from 'discord.js-light'
import { http, colors } from '../modules/util'

export default class Interaction {
  client: any

  application_id: any

  id: any

  token: any

  guild_id: any

  guild: any

  channel_id: any

  channel: any

  data: any

  member: any

  GuildMember: GuildMember

  type: any

  timestamp: number

  lang: any

  conf: any

  level: any

  embed: {
    default: (msg: string) => any
    success: (msg: string) => any
    error: (msg: string) => any
  }

  // set this to true when reponding to the interaction
  // so in subsequent replies, we post normal messages
  responded: boolean

  subcmds: Record<any, any>[]

  commandopts: Record<any, any>[]

  constructor(client, rawInteraction) {
    this.responded = false
    this.client = client
    this.application_id = rawInteraction.application_id
    this.id = rawInteraction.id
    this.token = rawInteraction.token
    this.guild_id = rawInteraction.guild_id
    this.guild = client.guilds.cache.get(rawInteraction.guild_id)
    this.channel_id = rawInteraction.channel_id
    this.channel = this.guild.channels.cache.get(rawInteraction.channel_id)
    this.data = rawInteraction.data
    this.member = rawInteraction.member
    this.GuildMember = new GuildMember(client, rawInteraction.member, this.guild)
    this.type = rawInteraction.type
    this.timestamp = Date.now()
    this.lang = rawInteraction.lang ? rawInteraction.lang : 'en'
    this.conf = rawInteraction.conf
    // either USER or STAFF (0 - normal USER no perms, 1 - Bot user, 2- STAFF (can change bot settings))
    this.level = rawInteraction.level
    this.embed = {
      default: (msg: string) => this.defaultEmbed(msg),
      success: (msg: string) => this.successEmbed(msg),
      error: (msg) => this.errorEmbed(msg),
    }

    this.subcmds = []
    this.commandopts = []

    if (this.data.options && this.data.options.length > 0) {
      let opts
      let action
      for (let i = 0; i < this.data.options.length; i += 1) {
        /**
                 *  if (interaction.data.options[index].type === 1) action = interaction.data.options[index].name
                    if (interaction.data.options[index].type === 1 && interaction.data.options[index].options)
                    commandopts = interaction.data.options[index].options
                 */
        if (this.data.options[i].type === 1) action = this.data.options[i].name
        if (this.data.options[i].type === 1 && this.data.options[i].options)
          opts = this.data.options[i].options
      }
      const subCmd = {
        name: null,
        options: null,
      }
      if (action) subCmd.name = action
      if (opts) subCmd.options = opts
      if (subCmd.name !== null) this.subcmds.push(subCmd)
    }
  }

  async replyMsg(msg: string | MessageEmbed, timeout = 0) {
    const repliedMsg = await this.channel.send(msg)
    if (timeout && timeout > 0) repliedMsg.delete({ timeout })
  }

  replyInteraction(msg: string, type = 4) {
    this.responded = true
    return this.client.api.interactions(this.id, this.token).callback.post({
      data: {
        type,
        data: {
          flags: 64,
          content: msg,
        },
      },
    })
  }

  replyInteractionEmbed(embed) {
    this.responded = true
    return this.client.api.interactions(this.id, this.token).callback.post({
      data: {
        type: 4,
        data: {
          flags: 64,
          embeds: [embed],
        },
      },
    })
  }

  reply(msg: any, timeout?: number) {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.responded === true ? this.replyMsg(msg, timeout) : this.replyInteraction(msg)
  }

  replyEmbed(msg: any, timeout?: number) {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    this.responded === true ? this.replyMsg(msg, timeout) : this.replyInteractionEmbed(msg)
  }

  async deleteOriginal(timeout?: number) {
    http.setToken(process.env.TOKEN)
    if (!timeout)
      // eslint-disable-next-line no-return-await
      return http.delete(
        `https://discord.com/api/v8/webhooks/${process.env.APPLICATION_ID}/${this.token}/messages/@original`,
      )
    setTimeout(async () => {
      await http.delete(
        `https://discord.com/api/v8/webhooks/${process.env.APPLICATION_ID}/${this.token}/messages/@original`,
      )
    }, timeout)
    return true
  }

  replyWithMessageAndDeleteAfterAWhile(msg) {
    switch (typeof msg) {
      case 'string':
        this.reply(msg, Number(process.env.MSG_DELETE))
        if (this.responded === true) this.deleteOriginal(Number(process.env.MSG_DELETE))
        break
      default:
        this.replyEmbed(msg, Number(process.env.MSG_DELETE))
        if (this.responded === true) this.deleteOriginal(Number(process.env.MSG_DELETE))
        break
    }
  }

  errorDisplay(msg: string) {
    this.replyWithMessageAndDeleteAfterAWhile(this.errorEmbed(msg))
  }

  successDisplay(msg: string) {
    this.replyWithMessageAndDeleteAfterAWhile(this.successEmbed(msg))
  }

  defaultEmbed(msg: string, color = 'BLUE') {
    return {
      description: msg,
      color: colors[color],
      author: {
        name: this.client.user.username,
      },
      thumbnail: {
        url: this.client.user.avatarURL(),
      },
      footer: {
        text: `Requested by ${this.member.user.username}#${this.member.user.discriminator}   •    www.todo-bot.xyz`,
        // cdn.discordapp.com/avatars/ user.id + user.avatar + .png
        icon_url: `https://cdn.discordapp.com/avatars/${this.member.user.id}/${this.member.user.avatar}.png`,
      },
    }
  }

  // eslint-disable-next-line class-methods-use-this
  successEmbed(msg: string, color = 'GREEN') {
    return {
      title: '✅ Success!',
      description: msg,
      color: colors[color],
    }
  }

  // eslint-disable-next-line class-methods-use-this
  errorEmbed(msg: string, color = 'RED') {
    return {
      title: '❌ Error',
      description: msg,
      color: colors[color],
    }
  }
}
