const {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "invite",
  aliases: ["inv"],
  description: "Invite the bot to your server or join the support server",
  category: "Info",
  cooldown: 5,
  run: async (client, message, args, prefix) => {
    const embed = new EmbedBuilder()
      .setColor("#1DB954") // Spotify green
      .setAuthor({
        name: `${client.user.username} Invite`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setTitle("🎵 Invite Flixo to Your Server!")
      .setDescription(
        "Bring high-quality music and powerful server management to your Discord community! " +
        "Use the buttons below to invite Flixo or join our support server for help and updates."
      )
      .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
      .setFooter({
        text: `Requested by ${message.author.username}`,
        iconURL: message.author.displayAvatarURL(),
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Invite Flixo")
        .setStyle(ButtonStyle.Link)
        .setURL(
          `https://discord.com/oauth2/authorize?client_id=1380994881731952741&permissions=100003281&scope=bot&response_type=code&redirect_uri=https://discord.gg/HaD5sYEj8w`
        ),
      new ButtonBuilder()
        .setLabel("Support Server")
        .setStyle(ButtonStyle.Link)
        .setURL(`${client.config.ssLink}`)
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};