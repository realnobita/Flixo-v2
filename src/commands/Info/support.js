const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "support",
  aliases: ["sup"],
  description: "Get the link to join the bot's support server",
  category: "Info",
  cooldown: 5,
  run: async (client, message, args, prefix) => {
    const embed = new EmbedBuilder()
      .setColor("#1DB954") // Spotify green
      .setAuthor({
        name: `${client.user.username} Support`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setTitle("📡 Join Our Support Server!")
      .setDescription(
        "Need help with the bot or want updates and community interaction? " +
        "Join our support server to connect with the team and other users!"
      )
      .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
      .setFooter({
        text: `Requested by ${message.author.username}`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Support Server")
        .setStyle(ButtonStyle.Link)
        .setEmoji("🔗")
        .setURL(`${client.config.ssLink}`)
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};