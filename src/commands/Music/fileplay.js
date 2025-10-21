const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { createAudioResource } = require("@discordjs/voice");
const updateQueue = require("../../handlers/setupQueue.js");

module.exports = {
  name: "fileplay",
  aliases: ["fp", "filep"],
  description: "Play a song from an uploaded audio file",
  category: "Music",
  inVc: true,
  sameVc: true,
  dj: true,
  premium: false,
  run: async (client, message, args, prefix) => {
    try {
      if (!message.attachments.size) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF5555")
              .setAuthor({
                name: "File Play",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("⛔ No File Attached")
              .setDescription(
                "Please attach a valid audio file (.mp3, .wav, .ogg, or .m4a).\n" +
                `Use \`${prefix}fileplay\` with an audio file to play it.`
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

      const file = message.attachments.first();
      const fileUrl = file.url;

      // Check extension
      if (!/\.(mp3|wav|ogg|m4a)$/i.test(file.name)) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF5555")
              .setAuthor({
                name: "File Play",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("⛔ Invalid File Format")
              .setDescription(
                "Unsupported file format. Please upload an .mp3, .wav, .ogg, or .m4a file.\n" +
                `Try again with a supported audio file.`
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

      // Create audio resource for the file
      const resource = createAudioResource(fileUrl, {
        metadata: {
          title: file.name,
          uri: fileUrl,
          requester: message.author,
        },
      });

      // Add to queue
      player.queue.add(resource.metadata);
      let wasPlaying = player.playing || player.paused;

      try {
        if (!wasPlaying) {
          await player.play(resource);
        }
      } catch (err) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF5555")
              .setAuthor({
                name: "File Play",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("⛔ Playback Error")
              .setDescription(
                "Failed to play the uploaded file.\n" +
                "Please ensure the file is a valid audio format and try again."
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

      const trackEmbed = new EmbedBuilder()
        .setColor("#1DB954") // Spotify green
        .setAuthor({
          name: "File Play",
          iconURL: client.user.displayAvatarURL(),
        })
        .setTitle(wasPlaying ? "✅ Track Queued" : "✅ Now Playing")
        .setDescription(
          `[${resource.metadata.title}](${resource.metadata.uri}) ` +
          (wasPlaying
            ? `has been added to the queue.\nUse \`${prefix}queue\` to view the queue.`
            : `is now playing.\nUse \`${prefix}nowplaying\` to see details.`)
        )
        .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
        .setFooter({
          text: `Requested by ${message.author.username}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

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
        embeds: [trackEmbed],
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
                      name: "File Play",
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
              player.queue.splice(0, 0, upcomingTrack);
              await interaction.update({
                embeds: [
                  new EmbedBuilder()
                    .setColor("#1DB954")
                    .setAuthor({
                      name: "File Play",
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
    } catch (err) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF5555")
            .setAuthor({
              name: "File Play",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("⛔ Error")
            .setDescription(
              "An error occurred while processing the file.\n" +
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