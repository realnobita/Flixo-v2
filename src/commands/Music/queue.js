const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "queue",
  aliases: ["q", "list"],
  description: "Show the current music queue",
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
                name: "Music Queue",
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

      const currentTrack = player.queue.current
        ? `**Now Playing:**\n**[${player.queue.current.title}](${player.queue.current.uri})** by ${player.queue.current.author}`
        : "Nothing is currently playing.";

      const tracks = player.queue.map(
        (track, i) =>
          `\`${i + 1}\` • **[${track.title}](${track.uri})** by ${track.author}`
      );

      if (!player.queue.current && !tracks.length) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF5555")
              .setAuthor({
                name: "Music Queue",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("⛔ Empty Queue")
              .setDescription(
                "The queue is currently empty.\n" +
                `Add songs with \`${prefix}play <song>\`.`
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

      const chunkSize = 10;
      const totalPages = Math.ceil(tracks.length / chunkSize) || 1;
      let page = 0;

      const generateEmbed = (page) => {
        const start = page * chunkSize;
        const end = start + chunkSize;
        const queuePage = tracks.slice(start, end);

        return new EmbedBuilder()
          .setColor("#1DB954") // Spotify green
          .setAuthor({
            name: `Music Queue • ${message.guild.name}`,
            iconURL: message.guild.iconURL() || client.user.displayAvatarURL(),
          })
          .setTitle("🎵 Current Queue")
          .setDescription(
            `${page === 0 ? currentTrack + "\n\n" : ""}${
              queuePage.length
                ? queuePage.join("\n")
                : "No upcoming tracks in queue."
            }`
          )
          .setThumbnail(
            player.queue.current?.thumbnail || client.user.displayAvatarURL({ size: 256 })
          )
          .setFooter({
            text: `Page ${page + 1} of ${totalPages} • Total Tracks: ${tracks.length} • Requested by ${message.author.username}`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();
      };

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("⬅️")
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("Next")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("➡️")
          .setDisabled(totalPages <= 1)
      );

      const msg = await message.reply({
        embeds: [generateEmbed(page)],
        components: totalPages > 1 ? [row] : [],
      });

      if (totalPages > 1) {
        const collector = msg.createMessageComponentCollector({
          filter: (i) => i.user.id === message.author.id,
        });

        collector.on("collect", async (interaction) => {
          if (!interaction.isButton()) return;

          if (interaction.customId === "prev") {
            page = page > 0 ? page - 1 : page;
          } else if (interaction.customId === "next") {
            page = page + 1 < totalPages ? page + 1 : page;
          }

          const newRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("prev")
              .setLabel("Previous")
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("⬅️")
              .setDisabled(page === 0),
            new ButtonBuilder()
              .setCustomId("next")
              .setLabel("Next")
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("➡️")
              .setDisabled(page + 1 === totalPages)
          );

          await interaction.update({
            embeds: [generateEmbed(page)],
            components: [newRow],
          });
        });
      }
    } catch (error) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF5555")
            .setAuthor({
              name: "Music Queue",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("⛔ Error")
            .setDescription(
              "An error occurred while fetching the queue.\n" +
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