const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "pause",
  aliases: ["pause"],
  description: "Pause the current music playback",
  category: "Music",
  cooldown: 5,
  inVc: true,
  sameVc: true,
  premium: false,
  dj: true,
  run: async (client, message, args, prefix, player) => {
    try {
      if (!player) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF5555")
              .setAuthor({
                name: "Pause Music",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("⛔ No Music Playing")
              .setDescription(
                "No music is currently playing on this server.\n" +
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

      if (player.paused) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF5555")
              .setAuthor({
                name: "Pause Music",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("⛔ Already Paused")
              .setDescription(
                "The music is already paused.\n" +
                `Use \`${prefix}resume\` to continue playback.`
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

      await player.pause(true);

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#1DB954") // Spotify green
            .setAuthor({
              name: "Pause Music",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("✅ Music Paused")
            .setDescription(
              `The music has been paused successfully.\n` +
              `Use \`${prefix}resume\` to continue rocking! 🎵`
            )
            .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
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
              name: "Pause Music",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("⛔ Error")
            .setDescription(
              "An error occurred while pausing the music.\n" +
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