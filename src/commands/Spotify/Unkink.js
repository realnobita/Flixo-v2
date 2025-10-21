// spotify-unlink.js
const { EmbedBuilder } = require("discord.js");
const Playlist = require("../../models/UserProfileSchema.js");

module.exports = {
    name: "spotify-unlink",
    aliases: ["sp-unlink", "unlinkspotify"],
    category: "Spotify",
    description: "Unlink your Spotify profile from the bot",
    args: false,
    usage: "",
    userPerms: [],
    owner: false,
    run: async (client, message) => {
        try {
            const doc = await Playlist.findOne({ userId: message.author.id, type: "spotify-user" });
            if (!doc) return message.reply({ embeds: [new EmbedBuilder().setColor(client.color).setDescription("No Spotify profile linked.")] });

            await Playlist.deleteOne({ userId: message.author.id, type: "spotify-user" });

            return message.reply({
                embeds: [
                    new EmbedBuilder().setColor(client.color).setTitle("Spotify Unlinked").setDescription("Your Spotify profile was unlinked.")
                ],
            });
        } catch (err) {
            console.error("spotify-unlink error:", err);
            return message.reply({ embeds: [new EmbedBuilder().setColor(client.color).setDescription("Failed to unlink Spotify profile.")] });
        }
    },
};