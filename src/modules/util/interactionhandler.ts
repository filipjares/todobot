/* eslint-disable camelcase */
/* eslint-disable no-nested-ternary */
import messages from '../../localization/messages'
import { Interaction, MyClient } from '../../classes'
import findCommonElements from './findCommonElements'

const interactionRecently = new Set()

// eslint-disable-next-line consistent-return
export default async (client: MyClient, raw_interaction) => {
  // eslint-disable-next-line global-require
  const interaction: Interaction = new Interaction(client, raw_interaction)

  if (interactionRecently.has(raw_interaction.member.user.id)) {
    interaction.errorDisplay(
      `You are being ratelimited. Please wait ${client.cooldown / 1000}s before trying again.`,
    )
  } else {
    // eslint-disable-next-line no-param-reassign
    raw_interaction.level = 0
    // whether the member is in cache or not (has recently voted)
    const isThere = await client.getAsync(interaction.member.user.id)

    const iscmd = await client.interactions.get(interaction.data.name)
    if (iscmd && iscmd.conf.premium !== false && isThere === null)
      return interaction.errorDisplay(`
      This command requires you to vote on [top.gg](https://top.gg/bot/709541772295929909/vote). 
      
      > Once voted you can use the command for the next 24 hours (or as long as your user id is in the bots cache so if an error occures lucky you :D)
      `)
    client.logger.cmd(
      `Received the interaction ${interaction.data.name} from ${interaction.member.user.username}#${interaction.member.user.discriminator}`,
    )
    try {
      const trans = client.apm.startTransaction(interaction.data.name, 'interactionhandler', {
        startTime: Date.now(),
      })
      client.apm.setUserContext({
        id: interaction.member.user.id,
        username: `${interaction.member.user.username}#${interaction.member.user.discriminator}`,
      })
      const permSpan = trans.startSpan('permission_checks', 'permission_checks')
      const conf = await client.config.get(interaction.guild_id)

      // if the user or channel are blacklisted we return an error
      if (conf && Object.values(conf.blacklist_users).includes(interaction.member.user.id))
        return interaction.errorDisplay(
          messages.blacklisted[
            interaction.conf ? (interaction.conf.lang ? interaction.conf.lang : 'en') : 'en'
          ],
        )
      if (conf && Object.values(conf.blacklist_channels).includes(interaction.channel_id))
        return interaction.errorDisplay(
          messages.blacklisted[
            interaction.conf ? (interaction.conf.lang ? interaction.conf.lang : 'en') : 'en'
          ],
        )
      // user is a normal bot user
      if (conf && findCommonElements(conf.userroles, interaction.member.roles)) interaction.level = 1
      // user is a staff member and can change bot settings
      if (conf && findCommonElements(conf.staffroles, interaction.member.roles)) interaction.level = 2
      interaction.lang = conf ? (conf.lang ? conf.lang : 'en') : 'en'
      interaction.conf = conf
      // this is important for the initial setup where the user has to set
      // a staff role so we need something to detemrmine they are permitted
      if (interaction.GuildMember.hasPermission('MANAGE_GUILD')) interaction.level = 2
      const cmd = client.interactions.get(interaction.data.name)

      if (interaction.level < client.util.get('permMap')[cmd.conf.permLevel])
        return interaction.errorDisplay(
          messages.permissionleveltoolow[
            interaction.conf ? (interaction.conf.lang ? interaction.conf.lang : 'en') : 'en'
          ],
        )
      if (permSpan) permSpan.end()
      cmd.run(client, interaction)
      client.apm.endTransaction(`success_interaction_${interaction.data.name}_handled`)
      // interaction cooldown
      interactionRecently.add(raw_interaction.member.user.id)
      setTimeout(() => {
        interactionRecently.delete(raw_interaction.member.user.id)
      }, client.cooldown)
    } catch (e) {
      client.logger.debug(e)
      interaction.errorDisplay(
        interaction.member.user.id === process.env.OWNER
          ? e.toString()
          : messages.generalerror[
              interaction.conf ? (interaction.conf.lang ? interaction.conf.lang : 'en') : 'en'
            ],
      )

      client.apm.endTransaction(`fail_interaction_${interaction.data.name}_handled`)
    }
  }
}
