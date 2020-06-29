module.exports = (client, guild) => {

    const { RichEmbed } = require('discord.js')
    let G = client.guilds.get("710022036252262485").channels.get("724031336351793263")
    let newserv = new RichEmbed()
    .setTitle(`Bot has been removed from a guild.`)
    .setThumbnail(guild.iconURL)
    .setDescription(`${guild.name} (ID: ${guild.id})`)
    .addField(`Owner:`, `> ${guild.owner} (${client.users.get(guild.owner.id).tag})`, true)
    .addField(`Region:`, `> ${guild.region}`, true)
    .addField(`Membercount:`, `> ${guild.memberCount}`, true)
    .setColor("RED")
  
    G.send(newserv);

}