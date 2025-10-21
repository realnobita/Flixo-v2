const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "remove",
  description: "Remove a song from the queue by its position",
  category: "Music",
  cooldown: 5,
  inVc: true,
  sameVc: true,
  vote: false,
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
                name: "Remove Song",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("⛔ No Music Player")
              .setDescription(
                "No active music player found for this server.\n" +
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

      if (!args[0]) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF5555")
              .setAuthor({
                name: "Remove Song",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("⛔ Missing Position")
              .setDescription(
                `Please provide the queue position of the song to remove.\n` +
                `Example: \`${prefix}remove 2\` to remove the second song.`
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

      const position = parseInt(args[0]);
      if (isNaN(position) || position > player.queue.length || position <= 0) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF5555")
              .setAuthor({
                name: "Remove Song",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("⛔ Invalid Position")
              .setDescription(
                `The position **${args[0]}** is invalid.\n` +
                `Please provide a number between 1 and ${player.queue.length}. Use \`${prefix}queue\` to view the queue.`
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

      const removedTrack = player.queue[position - 1];
      player.queue.remove(position - 1);

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#1DB954") // Spotify green
            .setAuthor({
              name: "Remove Song",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("✅ Song Removed")
            .setDescription(
              `Removed **[${removedTrack.title}](${removedTrack.uri})** from position **${position}**.\n` +
              `Use \`${prefix}queue\` to view the updated queue.`
            )
            .setThumbnail(removedTrack.thumbnail || client.user.displayAvatarURL({ size: 256 }))
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
              name: "Remove Song",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("⛔ Error")
            .setDescription(
              "An error occurred while removing the song.\n" +
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