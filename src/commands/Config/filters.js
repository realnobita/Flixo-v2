const {
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "filters",
  description: "Select and apply audio filters to the current music player",
  category: "Config",
  aliases: ["audiofilters", "af"],
  inVc: true,
  sameVc: true,
  dj: true,
  run: async (client, message, args, prefix, player) => {
    if (!player) {
      const embed = new EmbedBuilder()
        .setColor("#FF5555")
        .setAuthor({ name: "Audio Filters", iconURL: client.user.displayAvatarURL() })
        .setTitle("⛔ No Music Player Active")
        .setDescription(
          "There is no active music player in this server.\n" +
          `Play a track using \`${prefix}play <song>\` to use filters.`
        )
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      return message.channel.send({ embeds: [embed] });
    }

    // Filter definitions with descriptions
    const filters = [
      { name: "8D", description: "Creates a 3D audio effect" },
      { name: "BassBoost", description: "Boosts bass frequencies" },
      { name: "SuperBass", description: "Enhanced bass boost" },
      { name: "DeepBass", description: "Deep, powerful bass" },
      { name: "ExtraBass", description: "Extreme bass enhancement" },
      { name: "Echo", description: "Adds an echo effect" },
      { name: "Nightcore", description: "Increases speed and pitch" },
      { name: "Vaporwave", description: "Slows down with a retro vibe" },
      { name: "Tremolo", description: "Rhythmic volume pulsing" },
      { name: "Surround", description: "Enhances stereo sound" },
      { name: "Flanger", description: "Sweeping, jet-like effect" },
      { name: "SubBoost", description: "Boosts sub-bass frequencies" },
      { name: "Soft", description: "Smooths out harsh sounds" },
      { name: "Phaser", description: "Sweeping phase-shift effect" },
      { name: "Reverse", description: "Plays audio in reverse" },
      { name: "Treble", description: "Boosts high frequencies" },
      { name: "Chipmunk", description: "High-pitched, fast voice" },
      { name: "Distortion", description: "Adds gritty distortion" },
      { name: "Karaoke", description: "Reduces vocals for karaoke" },
      { name: "Gate", description: "Dynamic noise gate" },
      { name: "Pitch", description: "Adjusts pitch without speed" },
      { name: "Speed", description: "Changes playback speed" },
      { name: "Vibrato", description: "Wavy pitch modulation" },
      { name: "Rotation", description: "Rotating audio effect" },
      { name: "LowPass", description: "Filters out high frequencies" },
      { name: "HighPass", description: "Filters out low frequencies" },
      { name: "Compressor", description: "Balances audio dynamics" },
      { name: "Expander", description: "Increases dynamic range" },
      { name: "Limiter", description: "Prevents audio clipping" },
      { name: "Reverb", description: "Adds room-like echo" },
      { name: "Chorus", description: "Creates a layered sound" },
      { name: "Stereo", description: "Enhances stereo separation" },
      { name: "Normalizer", description: "Normalizes audio volume" },
      { name: "Crystal", description: "Brightens mid-high frequencies" },
      { name: "ClearVoice", description: "Enhances vocal clarity" },
    ];

    // Split filters into two menus (<=25 each)
    const firstMenuFilters = filters.slice(0, 20);
    const secondMenuFilters = filters.slice(20);

    const selectMenu1 = new StringSelectMenuBuilder()
      .setCustomId("filter-select-1")
      .setPlaceholder("Select filters (1-20)...")
      .setMinValues(0)
      .setMaxValues(firstMenuFilters.length)
      .addOptions(
        firstMenuFilters.map((filter) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(filter.name)
            .setValue(filter.name.toLowerCase())
            .setDescription(filter.description)
        )
      );

    const selectMenu2 = new StringSelectMenuBuilder()
      .setCustomId("filter-select-2")
      .setPlaceholder("Select filters (21-35)...")
      .setMinValues(0)
      .setMaxValues(secondMenuFilters.length)
      .addOptions(
        secondMenuFilters.map((filter) =>
          new StringSelectMenuOptionBuilder()
            .setLabel(filter.name)
            .setValue(filter.name.toLowerCase())
            .setDescription(filter.description)
        )
      );

    // Buttons with emojis
    const saveBtn = new ButtonBuilder()
      .setCustomId("filter-save")
      .setLabel("✅ Save Filters")
      .setStyle(ButtonStyle.Success);

    const resetBtn = new ButtonBuilder()
      .setCustomId("filter-reset")
      .setLabel("❌ Reset Filters")
      .setStyle(ButtonStyle.Danger);

    const row1 = new ActionRowBuilder().addComponents(selectMenu1);
    const row2 = new ActionRowBuilder().addComponents(selectMenu2);
    const row3 = new ActionRowBuilder().addComponents(saveBtn, resetBtn);

    let selectedFilters = [];

    const embed = new EmbedBuilder()
      .setColor("#1DB954") // Spotify green
      .setAuthor({ name: "Audio Filters", iconURL: client.user.displayAvatarURL() })
      .setTitle("🎵 Customize Audio Filters")
      .setDescription(
        "Choose audio filters from the menus below, then click **Save** to apply or **Reset** to clear all filters."
      )
      .setThumbnail(client.user.displayAvatarURL())
      .addFields(
        { name: "Active Filters", value: "None", inline: false },
        { name: "💡 Tip", value: "Select multiple filters to combine effects!", inline: false }
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    const msg = await message.channel.send({
      embeds: [embed],
      components: [row1, row2, row3],
    });

    const collector = msg.createMessageComponentCollector({ time: 60_000 });

    // Filter configurations
    const filterConfigs = {
      bassboost: { equalizer: [{ band: 0, gain: 0.6 }, { band: 1, gain: 0.67 }] },
      superbass: { equalizer: [{ band: 0, gain: 0.8 }, { band: 1, gain: 0.8 }] },
      deepbass: { equalizer: [{ band: 0, gain: 1.0 }, { band: 1, gain: 0.8 }, { band: 2, gain: 0.6 }] },
      extrabass: { equalizer: [{ band: 0, gain: 1.2 }, { band: 1, gain: 1.0 }] },
      crystal: { equalizer: [{ band: 3, gain: 0.5 }, { band: 4, gain: 0.5 }] },
      clearvoice: { equalizer: [{ band: 2, gain: 0.3 }, { band: 3, gain: 0.4 }] },
      nightcore: { timescale: { speed: 1.1, pitch: 1.2 } },
      vaporwave: { timescale: { speed: 0.85, pitch: 0.8 } },
      karaoke: { karaoke: { level: 1.0, monoLevel: 1.0, filterBand: 220, filterWidth: 100 } },
      tremolo: { tremolo: { frequency: 2.0, depth: 0.8 } },
      vibrato: { vibrato: { frequency: 4.0, depth: 0.75 } },
      rotation: { rotation: { rotationHz: 0.2 } },
      lowpass: { lowPass: { smoothing: 20.0 } },
      highpass: { equalizer: [{ band: 0, gain: -0.5 }] },
      // Add more filter configs as needed
    };

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({
          content: "You cannot use this menu. Only the command initiator can interact with it.",
          ephemeral: true,
        });
      }

      if (interaction.isStringSelectMenu()) {
        selectedFilters = [...new Set([...selectedFilters, ...interaction.values])];

        const newEmbed = EmbedBuilder.from(embed).setFields([
          { name: "Active Filters", value: selectedFilters.join(", ") || "None", inline: false },
          { name: "💡 Tip", value: "Select multiple filters to combine effects!", inline: false },
        ]);

        await interaction.update({ embeds: [newEmbed], components: [row1, row2, row3] });
      }

      if (interaction.isButton()) {
        if (interaction.customId === "filter-save") {
          const applyingEmbed = EmbedBuilder.from(embed).setFields([
            { name: "Active Filters", value: "Applying changes...", inline: false },
            { name: "💡 Status", value: "Please wait while filters are applied.", inline: false },
          ]);
          await interaction.update({ embeds: [applyingEmbed], components: [] });

          let finalConfig = { op: "filters", guildId: message.guild.id };
          for (const f of selectedFilters) {
            if (filterConfigs[f]) Object.assign(finalConfig, filterConfigs[f]);
          }
          try {
            await player.shoukaku.setFilters(finalConfig);
          } catch (error) {
            const errorEmbed = new EmbedBuilder()
              .setColor("#FF5555")
              .setAuthor({ name: "Audio Filters", iconURL: client.user.displayAvatarURL() })
              .setTitle("⛔ Error Applying Filters")
              .setDescription("An error occurred while applying filters. Please try again.")
              .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
              .setTimestamp();
            return msg.edit({ embeds: [errorEmbed], components: [] });
          }

          setTimeout(async () => {
            const appliedEmbed = new EmbedBuilder()
              .setColor("#1DB954")
              .setAuthor({ name: "Audio Filters", iconURL: client.user.displayAvatarURL() })
              .setTitle("✅ Filters Applied")
              .setDescription("Successfully applied the selected audio filters!")
              .addFields([
                { name: "Active Filters", value: selectedFilters.join(", ") || "None", inline: false },
                { name: "💡 Tip", value: `Use \`${prefix}filters\` again to modify filters.`, inline: false },
              ])
              .setFooter({ text: `Applied by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
              .setTimestamp();
            await msg.edit({ embeds: [appliedEmbed], components: [] });
          }, 2000);
        }

        if (interaction.customId === "filter-reset") {
          const resettingEmbed = EmbedBuilder.from(embed).setFields([
            { name: "Active Filters", value: "Resetting filters...", inline: false },
            { name: "💡 Status", value: "Please wait while filters are cleared.", inline: false },
          ]);
          await interaction.update({ embeds: [resettingEmbed], components: [] });

          try {
            await player.shoukaku.setFilters({ op: "filters", guildId: message.guild.id });
          } catch (error) {
            const errorEmbed = new EmbedBuilder()
              .setColor("#FF5555")
              .setAuthor({ name: "Audio Filters", iconURL: client.user.displayAvatarURL() })
              .setTitle("⛔ Error Resetting Filters")
              .setDescription("An error occurred while resetting filters. Please try again.")
              .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
              .setTimestamp();
            return msg.edit({ embeds: [errorEmbed], components: [] });
          }

          setTimeout(async () => {
            const resetEmbed = new EmbedBuilder()
              .setColor("#1DB954")
              .setAuthor({ name: "Audio Filters", iconURL: client.user.displayAvatarURL() })
              .setTitle("❌ Filters Reset")
              .setDescription("Successfully cleared all audio filters!")
              .addFields([
                { name: "Active Filters", value: "None", inline: false },
                { name: "💡 Tip", value: `Use \`${prefix}filters\` again to apply new filters.`, inline: false },
              ])
              .setFooter({ text: `Reset by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
              .setTimestamp();
            await msg.edit({ embeds: [resetEmbed], components: [] });
          }, 2000);
        }
      }
    });

    collector.on("end", async () => {
      const timeoutEmbed = EmbedBuilder.from(embed)
        .setDescription("Filter selection timed out. Run the command again to modify filters.")
        .setFields([
          { name: "Active Filters", value: selectedFilters.join(", ") || "None", inline: false },
          { name: "💡 Tip", value: `Use \`${prefix}filters\` to start a new filter session.`, inline: false },
        ]);
      await msg.edit({ embeds: [timeoutEmbed], components: [] }).catch(() => {});
    });
  },
};