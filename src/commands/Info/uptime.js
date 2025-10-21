const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "uptime",
  aliases: ["up"],
  description: "Check the bot's uptime",
  category: "Info",
  cooldown: 5,
  run: async (client, message, args, prefix) => {
    const duration = Math.round((Date.now() - client.uptime) / 1000);

    const embed = new EmbedBuilder()
      .setColor("#1DB954") // Spotify green
      .setAuthor({
        name: `${client.user.username} Uptime`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setTitle("⏰ Bot Uptime")
      .setDescription(
        `I've been rocking it since <t:${duration}:R>! Ready to keep the music and fun going!`
      )
      .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
      .setFooter({
        text: `Requested by ${message.author.username}`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    await message.channel.send({ embeds: [embed] });
  },
};