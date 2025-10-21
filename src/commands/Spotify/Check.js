// spotify-check.js
const { EmbedBuilder } = require("discord.js");
const Playlist = require("../../models/UserProfileSchema.js");

module.exports = {
  name: "spotify-check",
  aliases: ["sp-check", "spotify-linked"],
  description: "Check if your Spotify account is linked",
  category: "Spotify",
  args: false,
  usage: "",
  userPerms: [],
  owner: false,
  run: async (client, message, args, prefix) => {
    try {
      const doc = await Playlist.findOne({
        userId: message.author.id,
        type: "spotify-user",
      });

      if (!doc || !doc.url) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setTitle("Spotify Not Linked")
              .setDescription(
                `You don't have a Spotify account linked.\nUse \`${prefix}sp-attach <spotify_user_url>\` to link your account.`
              ),
          ],
        });
      }

      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setTitle("Spotify Linked")
            .setDescription(
              `Your Spotify account is linked!\nProfile: [Open](${doc.url})`
            )
            .setFooter({
              text: `Linked on: ${doc.createdAt.toDateString()}`,
            }),
        ],
      });
    } catch (err) {
      console.error("spotify-check error:", err);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(
              "Something went wrong while checking your Spotify link."
            ),
        ],
      });
    }
  },
};