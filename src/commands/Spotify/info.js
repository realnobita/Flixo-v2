// spotify-info.js
const { EmbedBuilder } = require("discord.js");
const Playlist = require("../../models/UserProfileSchema.js");

module.exports = {
    name: "spotify-info",
    aliases: ["sp-info"],
    category: "Spotify",
    description: "Show info for one of the Spotify user's playlists. Usage: sp-info <number>",
    args: true,
    usage: "<number>",
    userPerms: [],
    owner: false,
    run: async (client, message, args) => {
        try {
            const idxArg = args[0];
            const doc = await Playlist.findOne({ userId: message.author.id, type: "spotify-user" });
            if (!doc || !doc.url) return message.reply({ embeds: [new EmbedBuilder().setColor(client.color).setDescription("No Spotify profile linked.")] });

            let playlists = [];
            if (client.spotifyFetchUserPlaylists && typeof client.spotifyFetchUserPlaylists === "function") {
                try { playlists = await client.spotifyFetchUserPlaylists(doc.url); } catch (e) { console.warn(e); }
            }
            if (!playlists || playlists.length === 0) playlists = doc.playlists || [];

            const idx = parseInt(idxArg, 10) - 1;
            if (isNaN(idx) || idx < 0 || idx >= playlists.length) {
                return message.reply({ embeds: [new EmbedBuilder().setColor(client.color).setDescription("Invalid number. Use `sp-list` to see playlists.")] });
            }

            const p = playlists[idx];
            const embed = new EmbedBuilder()
                .setColor(client.color)
                .setTitle(p.name)
                .setURL(p.url)
                .setDescription(`Tracks: ${p.trackCount || "?"}`)
                .setThumbnail(p.thumbnail || null)
                .addFields(
                    { name: "Playlist URL", value: p.url },
                    { name: "Cached Index", value: `${idx + 1}`, inline: true }
                )
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            return message.reply({ embeds: [embed] });

        } catch (err) {
            console.error("spotify-info error:", err);
            return message.reply({ embeds: [new EmbedBuilder().setColor(client.color).setDescription("Failed to fetch playlist info.")] });
        }
    },
};