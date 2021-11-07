import { exec } from 'child_process'
import { writeFileSync } from 'fs'
import { format } from 'date-fns'

const run = async (client, message) => {
    if (!process.env.OWNER) return
    // making sure only bot owner can run the command
    if (message.author.id !== process.env.OWNER) return
    client.user.setActivity(`Applying an update!`, { type: 2, browser: 'DISCORD IOS' })

    exec('git pull', async (err, out, stderr) => {
        if (!err) {
            message.channel.send(client.embed(out))
            const msg = await message.channel.send(client.embed('Loading . . . . '))
            // eslint-disable-next-line no-console
            console.log(out)

            const formatted = format(Date.now(), `EEEE yyyy/MM/dd H:m`)
            const update = {
                applied: false,
                requested: message.author.tag,
                requested_id: message.author.id,
                channel: message.channel.id,
                msg: message.id,
                time: `${formatted}`,
                output: out,
                errors: err,
                stderr,
            }
            writeFileSync(`update.json-${Date.now()}`, JSON.stringify(update))
            msg.edit(client.embed(`Restarting . . . `))
            // eslint-disable-next-line @typescript-eslint/no-shadow
            exec(`pm2 restart ${process.env.PM2_NAME}`, (err, out, stderr) => {
                if (err && stderr !== '') {
                    message.channel.send(client.error(`${err} \n ${stderr}`))
                }
                message.channel.send(client.success(`Update was pulled and applied.`))
            })
        } else {
            message.channel.send(client.embed(`${out} \n\n ${stderr}`))
        }
    })
}

export default run

exports.conf = {
    enabled: true,
    guildOnly: true,
    party: false,
    aliases: [],
    permLevel: 'root',
}
exports.help = {
    name: 'update',
    category: 'System',
    description: 'Pulls the latest changes from github.',
    usage: 'update',
}
