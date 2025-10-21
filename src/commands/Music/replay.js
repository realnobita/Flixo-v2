const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "replay",
  description: "Replay the current song from the beginning",
  category: "Music",
  cooldown: 5,
  inVc: true,
  sameVc: true,
  vote: false,
  dj: true,
  premium: false,
  run: async (client, message, args, prefix, player) => {
    try {
      if (!player || !player.queue.current) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF5555")
              .setAuthor({
                name: "Replay Song",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("⛔ No Song Playing")
              .setDescription(
                "No song is currently playing.\n" +
                `Start playing music with \`${prefix}play <song>\` to use this command.`
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

      await player.seek(0);

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#1DB954") // Spotify green
            .setAuthor({
              name: "Replay Song",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("✅ Song Replayed")
            .setDescription(
              `Restarted **[${player.queue.current.title}](${player.queue.current.uri})** from the beginning.\n` +
              `Enjoy the track again! 🎵`
            )
            .setThumbnail(player.queue.current.thumbnail || client.user.displayAvatarURL({ size: 256 }))
            .setFooter({
              text: `Requested by ${message.author.username}`,
              iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp(),
        ],
      });
    } catch (error) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF5555")
            .setAuthor({
              name: "Replay Song",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("⛔ Error")
            .setDescription(
              "An error occurred while replaying the song.\n" +
              "Please try again or contact support if the issue persists."
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
  },
};