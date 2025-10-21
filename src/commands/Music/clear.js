const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "clear",
  aliases: ["clearqueue"],
  description: "Clear the music queue",
  category: "Music",
  cooldown: 5,
  inVc: true,
  sameVc: true,
  premium: false,
  dj: true,
  run: async (client, message, args, prefix, player) => {
    if (!player) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF5555")
            .setAuthor({
              name: "Clear Queue",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("⛔ No Music Player")
            .setDescription(
              "No active music player found for this server.\n" +
              `Start playing music with \`${prefix}play <song>\` to manage the queue.`
            )
            .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
            .setFooter({
              text: `Requested by ${message.author.username}`,
              iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp(),
        ],
      });
    }

    await player.queue.clear();

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#1DB954") // Spotify green
          .setAuthor({
            name: "Clear Queue",
            iconURL: client.user.displayAvatarURL(),
          })
          .setTitle("✅ Queue Cleared")
          .setDescription(
            "The music queue has been cleared successfully!\n" +
            `Add new tracks with \`${prefix}play <song>\`.`
          )
          .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
          .setFooter({
            text: `Requested by ${message.author.username}`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp(),
      ],
    });
  },
};