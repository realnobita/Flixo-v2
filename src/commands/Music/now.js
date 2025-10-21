const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "nowplaying",
  aliases: ["np", "now"],
  description: "Show the current song and next 3 in queue",
  category: "Music",
  owner: false,
  run: async (client, message, args, prefix) => {
    try {
      const player = client.manager.players.get(message.guild.id);
      if (!player) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF5555")
              .setAuthor({
                name: "Now Playing",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("⛔ No Music Player")
              .setDescription(
                "No active music player found for this server.\n" +
                `Start playing music with \`${prefix}play <song>\`.`
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

      const current = player.queue.current;
      if (!current) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF5555")
              .setAuthor({
                name: "Now Playing",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("⛔ Nothing Playing")
              .setDescription(
                "No track is currently playing.\n" +
                `Start a song with \`${prefix}play <song>\`.`
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

      const upcoming = player.queue.slice(0, 3);

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#1DB954") // Spotify green
            .setAuthor({
              name: `Now Playing in ${message.guild.name}`,
              iconURL: message.guild.iconURL() || client.user.displayAvatarURL(),
            })
            .setTitle("🎵 Current Track")
            .setDescription(
              `**[${current.title}](${current.uri})** by ${current.author}\n` +
              (upcoming.length
                ? `\n**Up Next:**\n${upcoming
                    .map(
                      (track, i) =>
                        `\`${i + 1}\` • [${track.title}](${track.uri}) by ${track.author}`
                    )
                    .join("\n")}`
                : "\nNo songs in the queue.")
            )
            .setThumbnail(current.thumbnail || client.user.displayAvatarURL({ size: 256 }))
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
              name: "Now Playing",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("⛔ Error")
            .setDescription(
              "An error occurred while fetching the current track.\n" +
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