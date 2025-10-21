const { EmbedBuilder } = require("discord.js");
const UserProfile = require("../../models/UserProfileSchema.js");
const updateQueue = require("../../handlers/setupQueue.js");

module.exports = {
  name: "fav-play",
  description: "Play all tracks from your favorites list",
  category: "Music",
  aliases: ["fplay", "favorites-play"],
  inVc: true,
  sameVc: true,
  dj: false,
  premium: false,
  run: async (client, message, args, prefix) => {
    const userId = message.author.id;
    let userProfile = await UserProfile.findOne({ userId });

    if (!userProfile || !userProfile.favorites.length) {
      const embed = new EmbedBuilder()
        .setColor("#FF5555")
        .setAuthor({ name: "Favorites Manager", iconURL: client.user.displayAvatarURL() })
        .setTitle("⛔ No Favorites Found")
        .setDescription(
          "You don't have any tracks in your favorites list to play!\n" +
          `Use \`${prefix}fav-add\` to add a track to your favorites.`
        )
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    const channel = message.member.voice.channel;
    if (!channel) {
      const embed = new EmbedBuilder()
        .setColor("#FF5555")
        .setAuthor({ name: "Favorites Manager", iconURL: client.user.displayAvatarURL() })
        .setTitle("⛔ Voice Channel Required")
        .setDescription(
          "You must be in a voice channel to play tracks from your favorites."
        )
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    // 🔀 Shuffle option check
    const shuffle = args[0] && args[0].toLowerCase() === "shuffle";
    const favorites = shuffle
      ? [...userProfile.favorites].sort(() => Math.random() - 0.5)
      : userProfile.favorites;

    const player = await client.manager.createPlayer({
      guildId: message.guild.id,
      textId: message.channel.id,
      voiceId: channel.id,
      volume: 80,
      deaf: true,
      shardId: message.guild.shardId,
    });

    let addedCount = 0;
    let failedCount = 0;
    for (const fav of favorites) {
      try {
        const result = await client.manager.search(fav.uri, { requester: message.author });
        if (result.tracks.length > 0) {
          player.queue.add(result.tracks[0]);
          addedCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        console.error(`Error adding favorite track: ${fav.title}`, err);
        failedCount++;
      }
    }

    if (addedCount === 0) {
      const embed = new EmbedBuilder()
        .setColor("#FFA500")
        .setAuthor({ name: "Favorites Manager", iconURL: client.user.displayAvatarURL() })
        .setTitle("⚠️ No Tracks Added")
        .setDescription(
          "None of your favorite tracks could be added to the queue.\n" +
          "They may have been removed or are unavailable."
        )
        .addFields({
          name: "View Favorites",
          value: `Use \`${prefix}fav-list\` to check your favorites list.`
        })
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (!player.playing && !player.paused) player.play();

    await updateQueue(message.guild, player.queue);

    const embed = new EmbedBuilder()
      .setColor("#1DB954") // Spotify green
      .setAuthor({ name: "Favorites Manager", iconURL: client.user.displayAvatarURL() })
      .setTitle(`${shuffle ? "🔀 Shuffled Favorites Queued" : "▶️ Favorites Queued"}`)
      .setDescription(
        `Successfully added **${addedCount}** favorite track${addedCount !== 1 ? "s" : ""} to the queue.` +
        (failedCount > 0 ? `\n*Note: ${failedCount} track${failedCount !== 1 ? "s" : ""} could not be added.*` : "")
      )
      .setThumbnail(favorites[0].thumbnail || client.user.displayAvatarURL())
      .addFields(
        { 
          name: "Total Tracks", 
          value: `${userProfile.favorites.length} in favorites list`, 
          inline: true 
        },
        { 
          name: "Queue Status", 
          value: shuffle ? "Shuffled" : "In order", 
          inline: true 
        },
        {
          name: "Manage Favorites",
          value: `Use \`${prefix}fav-list\` to view or \`${prefix}fav-clear\` to clear your favorites.`,
        }
      )
      .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};