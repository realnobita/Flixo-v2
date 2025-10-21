const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Genius = require("genius-lyrics");

const Client = new Genius.Client();

module.exports = {
  name: "lyrics",
  aliases: ["ly"],
  description: "Fetch lyrics for the current song or a given query",
  category: "Music",
  owner: false,
  run: async (client, message, args, prefix) => {
    try {
      const query = args.join(" ");
      const player = client.manager.players.get(message.guild.id);

      let searchQuery;
      if (query) {
        searchQuery = query;
      } else if (player && player.queue && player.queue.current) {
        searchQuery = player.queue.current.title;
      } else {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF5555")
              .setAuthor({
                name: "Lyrics Search",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("⛔ No Song or Query")
              .setDescription(
                "No song is currently playing, and no search query was provided.\n" +
                `Play a song with \`${prefix}play <song>\` or provide a query like \`${prefix}lyrics <song name>\`.`
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

      await message.channel.sendTyping();

      const searches = await Client.songs.search(searchQuery);
      if (!searches.length) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF5555")
              .setAuthor({
                name: "Lyrics Search",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("⛔ No Lyrics Found")
              .setDescription(
                `Couldn't find lyrics for **${searchQuery}**.\n` +
                `Try a different query or check the song title.`
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

      const song = searches[0];
      const lyrics = await song.lyrics();

      const chunkSize = 4096;
      const chunks = [];
      for (let i = 0; i < lyrics.length; i += chunkSize) {
        chunks.push(lyrics.substring(i, i + chunkSize));
      }

      let page = 0;
      const totalPages = chunks.length;

      const generateEmbed = (page) => {
        return new EmbedBuilder()
          .setColor("#1DB954") // Spotify green
          .setAuthor({
            name: `Lyrics: ${song.title} — ${song.artist.name}`,
            iconURL: client.user.displayAvatarURL(),
          })
          .setTitle("🎵 Song Lyrics")
          .setDescription(chunks[page] || "No lyrics available for this page.")
          .setThumbnail(song.thumbnail || client.user.displayAvatarURL({ size: 256 }))
          .setFooter({
            text: `Page ${page + 1} of ${totalPages} • Requested by ${message.author.username}`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp();
      };

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev_lyrics")
          .setLabel("Previous")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("⬅️")
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("next_lyrics")
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

          if (interaction.customId === "prev_lyrics") {
            page = page > 0 ? page - 1 : page;
          } else if (interaction.customId === "next_lyrics") {
            page = page + 1 < totalPages ? page + 1 : page;
          }

          const newRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("prev_lyrics")
              .setLabel("Previous")
              .setStyle(ButtonStyle.Secondary)
              .setEmoji("⬅️")
              .setDisabled(page === 0),
            new ButtonBuilder()
              .setCustomId("next_lyrics")
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
              name: "Lyrics Search",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("⛔ Error")
            .setDescription(
              "An error occurred while fetching lyrics.\n" +
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