const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const UserProfile = require("../../models/UserProfileSchema.js");
const updateQueue = require("../../handlers/setupQueue.js");

module.exports = {
  name: "fav-list",
  aliases: ["favorites", "myfavs"],
  description: "View and play your saved favorite tracks",
  category: "Music",
  inVc: true,
  sameVc: true,
  dj: false,
  premium: false,

  run: async (client, message, args, prefix) => {
    const userId = message.author.id;
    const profile = await UserProfile.findOne({ userId });

    if (!profile || !profile.favorites || !profile.favorites.length) {
      const embed = new EmbedBuilder()
        .setColor("#FF5555")
        .setAuthor({ name: "Favorites Manager", iconURL: client.user.displayAvatarURL() })
        .setTitle("⛔ No Favorites Found")
        .setDescription(
          "You haven't added any tracks to your favorites list yet.\n" +
          `Use \`${prefix}fav-add\` to add the currently playing track to your favorites.`
        )
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    // Play specific track if index is provided
    let index = parseInt(args[0]) - 1;
    if (!isNaN(index)) {
      if (!profile.favorites[index]) {
        const embed = new EmbedBuilder()
          .setColor("#FFA500")
          .setAuthor({ name: "Favorites Manager", iconURL: client.user.displayAvatarURL() })
          .setTitle("⚠️ Invalid Track Number")
          .setDescription(
            `Please provide a valid track number between 1 and ${profile.favorites.length}.\n` +
            `Use \`${prefix}fav-list\` to view your favorites.`
          )
          .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        return message.reply({ embeds: [embed] });
      }
      const fav = profile.favorites[index];
      return playFav(fav, message, client, prefix);
    }

    // Display favorites list with pagination
    const perPage = 5;
    let page = 0;
    const totalPages = Math.ceil(profile.favorites.length / perPage);

    const formatDuration = (ms) => {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const generateEmbed = () => {
      const start = page * perPage;
      const end = start + perPage;
      const list = profile.favorites
        .slice(start, end)
        .map(
          (track, i) =>
            `**${start + i + 1}.** [${track.title.length > 40 ? track.title.slice(0, 37) + "..." : track.title}](${track.uri}) — ${formatDuration(track.duration)}`
        )
        .join("\n");

      return new EmbedBuilder()
        .setColor("#1DB954") // Spotify green
        .setAuthor({ name: "Your Favorite Tracks", iconURL: client.user.displayAvatarURL() })
        .setTitle("🎵 Favorites Playlist")
        .setDescription(list || "No tracks on this page.")
        .setThumbnail(profile.favorites[start]?.thumbnail || client.user.displayAvatarURL())
        .addFields({
          name: "Play a Track",
          value: `Use \`${prefix}fav-list <number>\` to play a specific track.`,
        })
        .setFooter({
          text: `Page ${page + 1}/${totalPages} • ${profile.favorites.length} total favorites`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();
    };

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("prev_page")
        .setLabel("⬅️ Previous")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),
      new ButtonBuilder()
        .setCustomId("next_page")
        .setLabel("Next ➡️")
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(totalPages <= 1),
      new ButtonBuilder()
        .setCustomId("play_first")
        .setLabel("▶️ Play First")
        .setStyle(ButtonStyle.Success)
    );

    const msg = await message.reply({
      embeds: [generateEmbed()],
      components: [row],
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === "prev_page" && page > 0) page--;
      if (interaction.customId === "next_page" && page < totalPages - 1) page++;
      if (interaction.customId === "play_first") {
        const fav = profile.favorites[page * perPage];
        await interaction.deferUpdate();
        return playFav(fav, message, client, prefix);
      }

      const newRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev_page")
          .setLabel("⬅️ Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === 0),
        new ButtonBuilder()
          .setCustomId("next_page")
          .setLabel("Next ➡️")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(page === totalPages - 1),
        new ButtonBuilder()
          .setCustomId("play_first")
          .setLabel("▶️ Play First")
          .setStyle(ButtonStyle.Success)
      );

      await interaction.update({
        embeds: [generateEmbed()],
        components: [newRow],
      });
    });

    collector.on("end", async () => {
      await msg.edit({ components: [] }).catch(() => {});
    });

    // 🔥 Function to play a favorite track
    async function playFav(fav, message, client, prefix) {
      const channel = message.member.voice.channel;
      if (!channel) {
        const embed = new EmbedBuilder()
          .setColor("#FF5555")
          .setAuthor({ name: "Favorites Manager", iconURL: client.user.displayAvatarURL() })
          .setTitle("⛔ Voice Channel Required")
          .setDescription(
            "You must be in a voice channel to play a track from your favorites."
          )
          .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        return message.reply({ embeds: [embed] });
      }

      const player = await client.manager.createPlayer({
        guildId: message.guild.id,
        textId: message.channel.id,
        voiceId: channel.id,
        volume: 80,
        deaf: true,
        shardId: message.guild.shardId,
      });

      const result = await client.manager.search(fav.uri, {
        requester: message.author,
      });

      if (!result.tracks.length) {
        const embed = new EmbedBuilder()
          .setColor("#FFA500")
          .setAuthor({ name: "Favorites Manager", iconURL: client.user.displayAvatarURL() })
          .setTitle("⚠️ Track Not Found")
          .setDescription(
            `Could not find the track: **${fav.title.length > 50 ? fav.title.slice(0, 47) + "..." : fav.title}**.\n` +
            `It may have been removed or is unavailable.`
          )
          .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        return message.reply({ embeds: [embed] });
      }

      const track = result.tracks[0];
      player.queue.add(track);
      if (!player.playing && !player.paused) player.play();

      const trackEmbed = new EmbedBuilder()
        .setColor("#1DB954")
        .setAuthor({ name: "Favorites Manager", iconURL: client.user.displayAvatarURL() })
        .setTitle("▶️ Track Queued from Favorites")
        .setDescription(
          `**[${track.title.length > 50 ? track.title.slice(0, 47) + "..." : track.title}](${track.uri})** has been added to the queue.`
        )
        .setThumbnail(track.thumbnail || client.user.displayAvatarURL())
        .addFields(
          { name: "Artist", value: track.author.length > 30 ? track.author.slice(0, 27) + "..." : track.author, inline: true },
          { name: "Duration", value: formatDuration(track.duration), inline: true }
        )
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      await message.channel.send({ embeds: [trackEmbed] });
      await updateQueue(message.guild, player.queue);
    }
  },
};