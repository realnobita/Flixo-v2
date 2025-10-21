const { EmbedBuilder } = require("discord.js");

const activeIntervals = new Map();

module.exports = {
  name: "nowplaying",
  aliases: ["np", "now"],
  description: "Displays the currently playing song in a Spotify-style embed",
  category: "Music",
  inVc: true,
  sameVc: true,
  player: true,

  run: async (client, message, args, prefix, player) => {
    if (!player || !player.currentTrack) {
      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("⛔ No Song Playing")
        .setDescription("There is no song currently playing in this server.")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
      return message.reply({ embeds: [embed] });
    }

    const guildId = message.guild.id;

    // Clear existing interval if any
    if (activeIntervals.has(guildId)) {
      clearInterval(activeIntervals.get(guildId));
      activeIntervals.delete(guildId);
    }

    const track = player.currentTrack;
    const requester = track.requester?.tag || "Unknown";

    const formatTime = (ms) => {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    };

    const createProgressBar = (position, duration) => {
      const totalBars = 20;
      const progress = Math.min(position / duration, 1);
      const filledBars = Math.round(progress * totalBars);
      const emptyBars = totalBars - filledBars;
      return "▬".repeat(filledBars) + "🔘" + "▬".repeat(emptyBars);
    };

    const createEmbed = () => {
      const position = player.position;
      const duration = track.length || 1000; // Fallback duration
      const progress = Math.min(position / duration, 1);

      const embed = new EmbedBuilder()
        .setColor("#1DB954") // Spotify green
        .setTitle("🎵 Now Playing")
        .setThumbnail(track.thumbnail || client.user.displayAvatarURL())
        .setDescription(
          `**[${track.title.length > 50 ? track.title.slice(0, 47) + "..." : track.title}](${track.uri || "https://music.apple.com"})**\n` +
          `**Artist:** ${track.author.length > 30 ? track.author.slice(0, 27) + "..." : track.author}\n` +
          `**Requested by:** ${requester}\n\n` +
          `${formatTime(position)} ${createProgressBar(position, duration)} ${formatTime(duration)}`
        )
        .setTimestamp()
        .setFooter({ text: `${client.user.username} • Music`, iconURL: client.user.displayAvatarURL() });

      return embed;
    };

    // Send initial embed
    let msg = await message.channel.send({ embeds: [createEmbed()] });

    // Update every 5 seconds
    const interval = setInterval(async () => {
      if (!player || !player.currentTrack) {
        clearInterval(interval);
        activeIntervals.delete(guildId);
        if (msg) msg.delete().catch(() => {});
        return;
      }
      try {
        await msg.edit({ embeds: [createEmbed()] });
      } catch (error) {
        clearInterval(interval);
        activeIntervals.delete(guildId);
      }
    }, 5000);

    activeIntervals.set(guildId, interval);
  },
};

// === Music Event Handlers ===
// Add these to your main event handler (e.g., index.js or musicEvents.js)
// These ensure the nowplaying embed stops updating when the track or queue ends
module.exports.musicEvents = (client) => {
  // When a track ends
  client.manager.on("trackEnd", (player) => {
    const guildId = player.guild;
    if (activeIntervals.has(guildId)) {
      clearInterval(activeIntervals.get(guildId));
      activeIntervals.delete(guildId);
    }
  });

  // When the queue ends
  client.manager.on("queueEnd", (player) => {
    const guildId = player.guild;
    if (activeIntervals.has(guildId)) {
      clearInterval(activeIntervals.get(guildId));
      activeIntervals.delete(guildId);
    }
  });

  // When the player is destroyed
  client.manager.on("playerDestroy", (player) => {
    const guildId = player.guild;
    if (activeIntervals.has(guildId)) {
      clearInterval(activeIntervals.get(guildId));
      activeIntervals.delete(guildId);
    }
  });
};