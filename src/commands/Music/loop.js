const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
  name: "loop",
  aliases: ["loopstart"],
  description: "Toggle loop mode for the current track or queue",
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
              name: "Loop Music",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("⛔ No Music Player")
            .setDescription(
              "No active music player found for this server.\n" +
              `Start playing music with \`${prefix}play <song>\` to use loop.`
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

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("loop_track")
        .setLabel(player.loop === "track" ? "Unloop Track" : "Loop Track")
        .setStyle(player.loop === "track" ? ButtonStyle.Danger : ButtonStyle.Success)
        .setEmoji("🔂"),
      new ButtonBuilder()
        .setCustomId("loop_queue")
        .setLabel(player.loop === "queue" ? "Unloop Queue" : "Loop Queue")
        .setStyle(player.loop === "queue" ? ButtonStyle.Danger : ButtonStyle.Success)
        .setEmoji("🔁")
    );

    const sent = await message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#FFA500")
          .setAuthor({
            name: "Loop Music",
            iconURL: client.user.displayAvatarURL(),
          })
          .setTitle("🔄 Select Loop Mode")
          .setDescription(
            "Choose a loop mode for the music:\n" +
            `- **Loop Track**: Repeats the current song.\n` +
            `- **Loop Queue**: Repeats the entire queue.\n` +
            `Current mode: **${player.loop === "track" ? "Track" : player.loop === "queue" ? "Queue" : "None"}**`
          )
          .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
          .setFooter({
            text: `Requested by ${message.author.username}`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp(),
      ],
      components: [row],
    });

    const collector = sent.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 30000,
    });

    collector.on("collect", async (interaction) => {
      if (!interaction.isButton()) return;

      let embed;
      if (interaction.customId === "loop_track") {
        if (player.loop === "track") {
          player.setLoop("none");
          embed = new EmbedBuilder()
            .setColor("#1DB954")
            .setAuthor({
              name: "Loop Music",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("✅ Track Loop Disabled")
            .setDescription(
              "The current track will no longer loop.\n" +
              `Use \`${prefix}loop\` to enable looping again.`
            );
        } else {
          player.setLoop("track");
          embed = new EmbedBuilder()
            .setColor("#1DB954")
            .setAuthor({
              name: "Loop Music",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("✅ Track Loop Enabled")
            .setDescription(
              `The current track **${player.queue.current?.title || "Unknown"}** will now loop.\n` +
              `Use \`${prefix}loop\` to disable looping.`
            );
        }
      } else if (interaction.customId === "loop_queue") {
        if (player.loop === "queue") {
          player.setLoop("none");
          embed = new EmbedBuilder()
            .setColor("#1DB954")
            .setAuthor({
              name: "Loop Music",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("✅ Queue Loop Disabled")
            .setDescription(
              "The queue will no longer loop.\n" +
              `Use \`${prefix}loop\` to enable looping again.`
            );
        } else {
          player.setLoop("queue");
          embed = new EmbedBuilder()
            .setColor("#1DB954")
            .setAuthor({
              name: "Loop Music",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("✅ Queue Loop Enabled")
            .setDescription(
              "The entire queue will now loop.\n" +
              `Use \`${prefix}loop\` to disable looping.`
            );
        }
      }

      embed
        .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
        .setFooter({
          text: `Requested by ${message.author.username}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      await interaction.update({ embeds: [embed], components: [] });
    });

    collector.on("end", async () => {
      await sent.edit({ components: [] }).catch(() => {});
    });
  },
};