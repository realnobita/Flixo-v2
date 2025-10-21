const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "back",
  aliases: ["b", "previous"],
  description: "Plays the previous song in the queue",
  category: "Music",
  run: async (client, message) => {
    const player = client.kazagumo.players.get(message.guild.id);

    if (!player) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF5555")
            .setAuthor({
              name: "Back",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("⛔ No Music Player")
            .setDescription(
              "No active music player found for this server.\n" +
              "Start playing music with `!play <song>` to use the back command."
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

    if (!player.queue.previous) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF5555")
            .setAuthor({
              name: "Back",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("⛔ No Previous Song")
            .setDescription(
              "There is no previous song in the queue history.\n" +
              "Play more tracks to enable the back command."
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

    try {
      await player.play(player.queue.previous);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#1DB954") // Spotify green
            .setAuthor({
              name: "Back",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("✅ Playing Previous Song")
            .setDescription(
              `Now playing: **${player.queue.current.title}**\n` +
              "Use `!back` again to return to the previous track."
            )
            .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
            .setFooter({
              text: `Requested by ${message.author.username}`,
              iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp(),
        ],
      });
    } catch (e) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF5555")
            .setAuthor({
              name: "Back",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("⛔ Error")
            .setDescription(
              "Failed to play the previous song.\n" +
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
