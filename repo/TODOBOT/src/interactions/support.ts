/* eslint-disable no-nested-ternary */
import { MyClient, Interaction } from '../classes'
import messages from '../localization/messages'

const raw = {
  name: 'support',
  description: 'Get information on how to contact the developer(s).',
}

export default {
  raw,
  id: '',
  name: raw.name,
  conf: {
    enabled: true,
    premium: false,
    production: true,
    permLevel: 'USER',
  },
  help: {
    category: 'Utility',
    description: raw.description,
  },
  run: async (client: MyClient, interaction: Interaction) =>
    interaction.embed.default(
      messages.supportmessage[
        interaction.conf ? (interaction.conf.lang ? interaction.conf.lang : 'en') : 'en'
      ],
    ),
}
