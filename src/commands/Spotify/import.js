// spotify-import.js
const { EmbedBuilder } = require("discord.js");
const Playlist = require("../../models/UserProfileSchema.js");

module.exports = {
    name: "spotify-import",
    aliases: ["sp-import"],
    category: "Spotify",
    description: "Import a Spotify user's playlist into one of your bot playlists. Usage: sp-import <playlist_number> <target_playlist_name>",
    args: true,
    usage: "<playlist_number> <target_playlist_name>",
    userPerms: [],
    owner: false,
    run: async (client, message, args, prefix) => {
        const idxArg = args[0];
        const targetName = args.slice(1).join(" ");
        if (!idxArg || !targetName) {
            return message.reply({ embeds: [new EmbedBuilder().setColor(client.color).setDescription(`Usage: ${prefix}sp-import <playlist_number> <target_playlist_name>`)] });
        }

        try {
            const doc = await Playlist.findOne({ userId: message.author.id, type: "spotify-user" });
            if (!doc || !doc.url) return message.reply({ embeds: [new EmbedBuilder().setColor(client.color).setDescription("No Spotify profile linked.")] });

            let playlists = [];
            if (client.spotifyFetchUserPlaylists && typeof client.spotifyFetchUserPlaylists === "function") {
                try { playlists = await client.spotifyFetchUserPlaylists(doc.url); } catch (e) { console.warn(e); }
            }
            if (!playlists || playlists.length === 0) playlists = doc.playlists || [];

            const idx = parseInt(idxArg, 10) - 1;
            if (isNaN(idx) || idx < 0 || idx >= playlists.length) {
                return message.reply({ embeds: [new EmbedBuilder().setColor(client.color).setDescription("Invalid playlist number.")] });
            }

            const selected = playlists[idx];

            // === PLACEHOLDER: fetch actual tracks of `selected.id` using Spotify API
            // You should implement client.spotifyFetchPlaylistTracks(playlistId) that returns normalized array:
            // [{ title, duration (ms), thumbnail, url }]
            let tracks = [];
            if (client.spotifyFetchPlaylistTracks && typeof client.spotifyFetchPlaylistTracks === "function") {
                try {
                    tracks = await client.spotifyFetchPlaylistTracks(selected.id);
                } catch (e) {
                    console.warn("spotifyFetchPlaylistTracks error:", e);
                }
            }

            // fallback: if no tracks fetched, simulate or error
            if (!tracks || tracks.length === 0) {
                return message.reply({ embeds: [new EmbedBuilder().setColor(client.color).setDescription("Failed to fetch tracks from Spotify. Integrate Spotify API or ensure playlist cache exists.")] });
            }

            // find or create target bot playlist (normal PlaylistSchema entry without type or with type "bot")
            let botPlaylist = await Playlist.findOne({ userId: message.author.id, name: targetName });
            if (!botPlaylist) {
                botPlaylist = new Playlist({
                    userId: message.author.id,
                    name: targetName,
                    songs: [],
                    createdAt: new Date(),
                    updatedAt: new Date()
                });
            }

            // append tracks (transform if necessary)
            const toAdd = tracks.map(t => ({ title: t.title, duration: t.duration, thumbnail: t.thumbnail, url: t.url }));
            botPlaylist.songs.push(...toAdd);
            botPlaylist.updatedAt = new Date();
            await botPlaylist.save();

            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setTitle("Imported Playlist")
                        .setDescription(`Imported **${toAdd.length}** tracks from **${selected.name}** into **${targetName}**`)
                        .setFooter({ text: `Imported by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                        .setTimestamp()
                ],
            });

        } catch (err) {
            console.error("spotify-import error:", err);
            return message.reply({ embeds: [new EmbedBuilder().setColor(client.color).setDescription("Failed to import playlist.")] });
        }
    },
};