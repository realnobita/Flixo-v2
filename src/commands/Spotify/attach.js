// spotify-attach.js
const { EmbedBuilder } = require("discord.js");
const Playlist = require("../../models/UserProfileSchema.js");

module.exports = {
    name: "spotify-attach",
    aliases: ["sp-attach", "attachspotify", "sp-link"],
    category: "Spotify",
    description: "Attach a Spotify user/profile URL (example: https://open.spotify.com/user/...)",
    args: true,
    usage: "<spotify_user_url>",
    userPerms: [],
    owner: false,
    run: async (client, message, args) => {
        const url = args[0];
        if (!url || !url.startsWith("https://open.spotify.com/user/")) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription("Please provide a valid Spotify user/profile URL. Example: `https://open.spotify.com/user/31twovowvkscvo3rd6zn6hj62n4q`")
                ],
            });
        }

        try {
            let doc = await Playlist.findOne({ userId: message.author.id, type: "spotify-user" });
            if (!doc) {
                doc = new Playlist({
                    userId: message.author.id,
                    name: "SpotifyUser",
                    type: "spotify-user",
                    url,
                    playlists: [], // cached playlists (id,name,url,trackCount,thumbnail)
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            } else {
                doc.url = url;
                doc.updatedAt = new Date();
            }

            await doc.save();

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setTitle("Spotify Linked")
                        .setDescription(`Successfully linked Spotify profile:\n${url}`)
                        .setFooter({ text: `Linked by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                        .setTimestamp()
                ],
            });
        } catch (err) {
            console.error("spotify-attach error:", err);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription("Failed to attach Spotify profile.")
                ],
            });
        }
    },
};