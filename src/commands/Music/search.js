const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
} = require("discord.js");

module.exports = {
  name: "search",
  description: `Search a song based on your interest!`,
  vote: true,

  run: async (client, message, args, prefix, player) => {
    const tick = "<:floovi_tick:1381965556277710860>";
    const cross = "<:floovi_cross:1382029455601569904>";
    const warn = "<:floovi_warn:1382779289858211880>";

    const query = args.join(" ");
    if (!query) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.color)
            .setDescription(`${warn} | Usage: \`${prefix}search <song name>\``),
        ],
      });
    }

    // ✅ Voice Channel & Permission checks
    const { channel } = message.member.voice;
    if (!channel) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.color)
            .setDescription(`${cross} | You must be in a voice channel to use this command.`),
        ],
      });
    }

    const botPerms = channel.permissionsFor(message.guild.members.me);
    if (!botPerms.has(PermissionFlagsBits.Connect)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.color)
            .setDescription(`${cross} | I don’t have **Connect** permission in your VC.`),
        ],
      });
    }
    if (!botPerms.has(PermissionFlagsBits.Speak)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.color)
            .setDescription(`${cross} | I don’t have **Speak** permission in your VC.`),
        ],
      });
    }

    try {
      await message.channel.sendTyping();
      const result = await client.manager.search(query, {
        requester: message.author,
      });

      if (!result.tracks.length) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.config.color)
              .setDescription(`${cross} | No results found for \`${query}\`.`),
          ],
        });
      }

      const topTracks = result.tracks.slice(0, 10);

      const embed = new EmbedBuilder()
        .setColor(client.config.color)
        .setTitle(`🔍 Search Results for: "${query}"`)
        .setDescription(
          topTracks
            .map(
              (track, i) =>
                `**${i + 1}.** [${track.title}](${track.uri}) • \`${track.author}\``
            )
            .join("\n")
        )
        .setFooter({ text: "Select a song from the menu below to play." });

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId("select-song")
        .setPlaceholder("Choose a song to play")
        .addOptions(
          topTracks.map((track, index) => ({
            label: track.title.slice(0, 25),
            description: track.author.slice(0, 45),
            value: index.toString(),
          }))
        );

      const row = new ActionRowBuilder().addComponents(selectMenu);

      const searchMessage = await message.channel.send({
        embeds: [embed],
        components: [row],
      });

      const filter = (interaction) =>
        interaction.isStringSelectMenu() &&
        interaction.customId === "select-song" &&
        interaction.user.id === message.author.id;

      const collector = searchMessage.createMessageComponentCollector({
        filter,
        time: 10000, // 10 sec timeout
      });

      collector.on("collect", async (interaction) => {
        try {
          await interaction.deferReply({ ephemeral: true });

          const selectedIndex = parseInt(interaction.values[0], 10);
          const selectedTrack = topTracks[selectedIndex];

          // Voice channel double-check
          if (!message.member.voice.channelId) {
            return interaction.editReply({
              content: `${cross} | You must be in a voice channel to play music.`,
            });
          }

          if (!player) {
            player = await client.manager.createPlayer({
              guildId: message.guild.id,
              voiceId: message.member.voice.channelId,
              textId: message.channel.id,
            });
          }

          player.queue.add(selectedTrack);
          if (!player.playing && !player.paused && !player.queue.size) player.play();

          // ✅ Edit original embed (not reply only)
          await searchMessage.edit({
            embeds: [
              new EmbedBuilder()
                .setColor(client.config.color)
                .setDescription(
                  `${tick} | Added to queue: **[${selectedTrack.title}](${selectedTrack.uri})** • \`${selectedTrack.author}\``
                ),
            ],
            components: [],
          });

          await interaction.editReply({
            content: `${tick} | Your song has been added successfully.`,
          });

          collector.stop("added");
        } catch (err) {
          console.error("Select menu error:", err);
          await interaction.editReply({
            content: `${cross} | An error occurred while trying to play the selected track.`,
          });
        }
      });

      collector.on("end", (_, reason) => {
        if (reason !== "added") {
          searchMessage.edit({
            embeds: [
              new EmbedBuilder()
                .setColor(client.config.color)
                .setDescription(`${warn} | Search timed out. No song was selected.`),
            ],
            components: [],
          });
        }
      });
    } catch (err) {
      console.error(err);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.color)
            .setDescription(`${cross} | Something went wrong while searching.`),
        ],
      });
    }
  },
};
