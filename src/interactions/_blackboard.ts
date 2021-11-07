import MyClient from '../classes/Client'
import Interaction from '../classes/Interaction'

const raw = {
  name: 'blackboard',
  description: 'Send a central blackboad message, where currently open and processed tasks are displayed',
  options: [
    {
      name: 'reset',
      description: 'Reset the blackboard and repost it in the current channel.',
      required: false,
      type: 1,
    },
  ],
}

module.exports = {
  raw,
  id: '',
  name: raw.name,
  conf: {
    enabled: true,
    premium: false,
    // USER - BOT_USER - STAFF
    permLevel: 'USER',
  },
  help: {
    category: 'Utility',
    description: raw.description,
  },
  run: async (client: MyClient, interaction: Interaction) => {
    // eslint-disable-next-line no-console
    console.log(client, interaction)
  },
}
