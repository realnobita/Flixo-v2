const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const updateQueue = require("../../handlers/setupQueue.js");

module.exports = {
  name: "play",
  aliases: ["p"],
  description: "Play a song or playlist",
  category: "Music",
  inVc: true,
  sameVc: true,
  dj: true,
  premium: false,
  run: async (client, message, args, prefix) => {
    try {
      const query = args.join(" ");
      if (!query) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF5555")
              .setAuthor({
                name: "Play Music",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("⛔ Missing Query")
              .setDescription(
                "Please provide a song name, URL, or playlist to play.\n" +
                `Example: \`${prefix}play Bohemian Rhapsody\``
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

      let player = client.manager.players.get(message.guild.id);
      if (!player) {
        player = await client.manager.createPlayer({
          guildId: message.guild.id,
          textId: message.channel.id,
          voiceId: message.member.voice.channel.id,
          volume: 80,
          deaf: true,
          shardId: message.guild.shardId,
        });
      }

      const result = await client.manager.search(query, { requester: message.author });
      if (!result.tracks.length) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF5555")
              .setAuthor({
                name: "Play Music",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("⛔ No Results Found")
              .setDescription(
                `No results found for **${query}**.\n` +
                "Try a different song name, URL, or playlist."
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

      let wasPlaying = player.playing || player.paused;
      if (result.type === "PLAYLIST") {
        result.tracks.forEach((track) => player.queue.add(track));
        if (!wasPlaying) {
          try {
            await player.play();
          } catch (err) {
            return message.reply({
              embeds: [
                new EmbedBuilder()
                  .setColor("#FF5555")
                  .setAuthor({
                    name: "Play Music",
                    iconURL: client.user.displayAvatarURL(),
                  })
                  .setTitle("⛔ Playback Error")
                  .setDescription(
                    "Failed to play the playlist.\n" +
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
        }

        await updateQueue(message.guild, player.queue);
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1DB954") // Spotify green
              .setAuthor({
                name: "Play Music",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle(wasPlaying ? "✅ Playlist Queued" : "✅ Playlist Playing")
              .setDescription(
                `Added **${result.tracks.length}** songs from **[${result.playlistName}](${query})**.\n` +
                (wasPlaying
                  ? `View the queue with \`${prefix}queue\`.`
                  : `Now playing the first track!`)
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

      const track = result.tracks[0];
      player.queue.add(track);
      if (!wasPlaying) {
        try {
          await player.play();
        } catch (err) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor("#FF5555")
                .setAuthor({
                  name: "Play Music",
                  iconURL: client.user.displayAvatarURL(),
                })
                .setTitle("⛔ Playback Error")
                .setDescription(
                  "Failed to play the track.\n" +
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
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("upcoming")
          .setLabel("Add as Upcoming")
          .setStyle(ButtonStyle.Secondary)
          .setEmoji("⏭️"),
        new ButtonBuilder()
          .setCustomId("remove_song")
          .setLabel("Remove")
          .setStyle(ButtonStyle.Danger)
          .setEmoji("🗑️")
      );

      const showButtons = player.queue.length >= (wasPlaying ? 2 : 1);
      const sent = await message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#1DB954") // Spotify green
            .setAuthor({
              name: "Play Music",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle(wasPlaying ? "✅ Track Queued" : "✅ Now Playing")
            .setDescription(
              `**[${track.title}](${track.uri})** by ${track.author} ` +
              (wasPlaying
                ? `has been added to the queue.\nUse \`${prefix}queue\` to view the queue.`
                : `is now playing.\nUse \`${prefix}nowplaying\` to see details.`)
            )
            .setThumbnail(track.thumbnail || client.user.displayAvatarURL({ size: 256 }))
            .setFooter({
              text: `Requested by ${message.author.username}`,
              iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp(),
        ],
        components: showButtons ? [row] : [],
      });

      if (showButtons) {
        const collector = sent.createMessageComponentCollector({
          filter: (i) => i.user.id === message.author.id,
        });

        collector.on("collect", async (interaction) => {
          if (!interaction.isButton()) return;

          switch (interaction.customId) {
            case "remove_song":
              player.queue.pop();
              await interaction.update({
                embeds: [
                  new EmbedBuilder()
                    .setColor("#1DB954")
                    .setAuthor({
                      name: "Play Music",
                      iconURL: client.user.displayAvatarURL(),
                    })
                    .setTitle("✅ Track Removed")
                    .setDescription(
                      "The track has been removed from the queue.\n" +
                      `Use \`${prefix}queue\` to view the updated queue.`
                    )
                    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
                    .setFooter({
                      text: `Requested by ${message.author.username}`,
                      iconURL: message.author.displayAvatarURL(),
                    })
                    .setTimestamp(),
                ],
                components: [],
              });
              break;

            case "upcoming":
              const upcomingTrack = player.queue.pop();
              player.queue.splice(1, 0, upcomingTrack); // Changed to index 1 to play after current
              await interaction.update({
                embeds: [
                  new EmbedBuilder()
                    .setColor("#1DB954")
                    .setAuthor({
                      name: "Play Music",
                      iconURL: client.user.displayAvatarURL(),
                    })
                    .setTitle("✅ Track Moved")
                    .setDescription(
                      "The track will play after the current song.\n" +
                      `Use \`${prefix}queue\` to view the updated queue.`
                    )
                    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
                    .setFooter({
                      text: `Requested by ${message.author.username}`,
                      iconURL: message.author.displayAvatarURL(),
                    })
                    .setTimestamp(),
                ],
                components: [],
              });
              break;
          }
        });
      }

      await updateQueue(message.guild, player.queue);
    } catch (error) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF5555")
            .setAuthor({
              name: "Play Music",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("⛔ Error")
            .setDescription(
              "An error occurred while processing your request.\n" +
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