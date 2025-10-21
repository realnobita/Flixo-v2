const { EmbedBuilder } = require("discord.js");
const Playlist = require("../../models/PlaylistSchema");

function formatDuration(duration) {
    if(isNaN(duration) || typeof duration === 'undefined') return '00:00';
    if(duration > 3600000000) return 'Live';
    
    const seconds = Math.floor((duration / 1000) % 60);
    const minutes = Math.floor((duration / (1000 * 60)) % 60);
    const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  
    const hoursStr = hours < 10 ? `0${hours}` : hours;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    const secondsStr = seconds < 10 ? `0${seconds}` : seconds;
  
    return `${hoursStr}:${minutesStr}:${secondsStr}`;
}

module.exports = {
    name: "pl-add",
    aliases: ["playlist-add", "addtoplaylist"],
    category: "Playlist",
    description: "Add a song to your playlist",
    args: true,
    usage: "<playlist_name> <song>",
    userPerms: [],
    owner: false,
    run: async (client, message, args, prefix) => {
        if (args.length < 2) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} | Usage: \`${prefix}pl-add <playlist_name> <song>\``,
                        ),
                ],
            });
        }

        const playlistName = args[0];
        const song = args.slice(1).join(" ");

        if (!song) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} | Please provide a song to add!`,
                        ),
                ],
            });
        }

        try {
            // Find the playlist
            const playlist = await Playlist.findOne({
                userId: message.author.id,
                name: playlistName,
            });

            if (!playlist) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} | Playlist **${playlistName}** not found!`,
                            ),
                    ],
                });
            }

            // Search for the song
            const result = await client.manager.search(song, {
                requester: message.author,
            });

            if (!result.tracks.length) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} | No songs found for **${song}**!`,
                            ),
                    ],
                });
            }

            const track = result.tracks[0];

            // Check if song already exists in playlist
            const songExists = playlist.songs.some((s) => s.url === track.uri);
            if (songExists) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.color)
                            .setDescription(
                                `${client.emoji.cross} | This song is already in the playlist!`,
                            ),
                    ],
                });
            }

            // Add song to playlist
            playlist.songs.push({
                title: track.title,
                url: track.uri,
                duration: track.length,
                thumbnail: track.thumbnail,
                author: track.author,
                addedAt: new Date(),
            });

            playlist.updatedAt = new Date();
            await playlist.save();

            const embed = new EmbedBuilder()
                .setColor(client.color)
                .setTitle(`${client.emoji.tick} Song Added`)
                .setDescription(
                    `Successfully added **[${track.title}](${client.config.ssLink})** to playlist: **${playlistName}**`,
                )
                .setThumbnail(track.thumbnail)
                .addFields({
                    name: "Duration",
                    value: formatDuration(track.length),
                    inline: true,
                })
                .setFooter({
                    text: `Added by ${message.author.tag}`,
                    iconURL: message.author.displayAvatarURL(),
                })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Error adding song to playlist:", error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(
                            `${client.emoji.cross} | An error occurred while adding the song!`,
                        ),
                ],
            });
        }
    },
};
