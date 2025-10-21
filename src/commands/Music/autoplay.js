const { EmbedBuilder } = require("discord.js");
const { autoplayHandler } = require("../../handlers/autoplay.js");

module.exports = {
  name: "autoplay",
  aliases: ["ap"],
  description: "Toggle autoplay mode",
  category: "Music",
  cooldown: 5,
  inVc: true,
  sameVc: true,
  run: async (client, message, args, prefix, player) => {
    try {
      if (!player) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("#FF5555")
              .setAuthor({
                name: "Autoplay",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("⛔ No Music Player")
              .setDescription(
                "No active music player found for this server.\n" +
                `Start playing music with \`${prefix}play <song>\` to use autoplay.`
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

      if (player.data.get("autoplay")) {
        player.data.set("autoplay", false);
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1DB954") // Spotify green
              .setAuthor({
                name: "Autoplay",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("✅ Autoplay Deactivated")
              .setDescription(
                "Autoplay has been turned off.\n" +
                `Use \`${prefix}autoplay\` again to reactivate it.`
              )
              .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
              .setFooter({
                text: `Requested by ${message.author.username}`,
                iconURL: message.author.displayAvatarURL(),
              })
              .setTimestamp(),
          ],
        });
      } else {
        player.data.set("autoplay", true);
        player.data.set("requester", message.author);

        if (player.queue.current) {
          player.data.set("identifier", player.queue.current.identifier);
          player.data.set("lastTrack", player.queue.current);
          await autoplayHandler(player, client, player.queue.current);
        }

        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1DB954") // Spotify green
              .setAuthor({
                name: "Autoplay",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("✅ Autoplay Activated")
              .setDescription(
                "Autoplay is now enabled! The bot will automatically queue similar tracks.\n" +
                `Use \`${prefix}autoplay\` again to deactivate it.`
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
    } catch (err) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF5555")
            .setAuthor({
              name: "Autoplay",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("⛔ Error")
            .setDescription(
              "An error occurred while toggling autoplay.\n" +
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