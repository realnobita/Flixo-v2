const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "disconnect",
  aliases: ["dc", "leave"],
  description: "Disconnect the bot from the voice channel",
  botPermissions: ["SendMessages"],
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
              name: "Disconnect",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("⛔ No Music Player")
            .setDescription(
              "No active music player found for this server.\n" +
              `Start playing music with \`${prefix}play <song>\` to use this command.`
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

    // Try deleting the last Flixo embed (optional cleanup)
    try {
      const fetched = await message.channel.messages.fetch({ limit: 10 });
      const flixoEmbedMsg = fetched.find(
        (msg) =>
          msg.embeds.length > 0 &&
          msg.author?.id === client.user.id &&
          msg.embeds[0]?.author?.name?.includes(client.user.username)
      );

      if (flixoEmbedMsg) await flixoEmbedMsg.delete().catch(() => {});
    } catch (err) {
      // Ignore silently
    }

    await player.destroy();

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#1DB954") // Spotify green
          .setAuthor({
            name: "Disconnect",
            iconURL: client.user.displayAvatarURL(),
          })
          .setTitle("✅ Disconnected")
          .setDescription(
            `${client.user.username} has left the voice channel.\n` +
            "Thanks for rocking with us! Ready for more tunes? 🎵"
          )
          .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
          .setFooter({
            text: `Requested by ${message.author.username}`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp(),
      ],
    });
  },
};