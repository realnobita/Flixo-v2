
const { EmbedBuilder } = require("discord.js");
const Playlist = require("../../models/PlaylistSchema");

module.exports = {
    name: "pl-remove",
    aliases: ["playlist-remove", "removefromplaylist"],
    category: "Playlist",
    description: "Remove a song from playlist",
    args: true,
    usage: "<playlist_name> <song_position>",
    userPerms: [],
    owner: false,
    run: async (client, message, args, prefix) => {
        if (args.length < 2) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | Usage: \`${prefix}pl-remove <playlist_name> <song_position>\``)
                ],
            });
        }

        const playlistName = args[0];
        const position = parseInt(args[1]);

        if (isNaN(position) || position < 1) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | Please provide a valid song position!`)
                ],
            });
        }

        try {
            const playlist = await Playlist.findOne({
                userId: message.author.id,
                name: playlistName
            });

            if (!playlist) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} | Playlist **${playlistName}** not found!`)
                    ],
                });
            }

            if (position > playlist.songs.length) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} | Invalid position! This playlist has only **${playlist.songs.length}** songs.`)
                    ],
                });
            }

            const removedSong = playlist.songs[position - 1];
            playlist.songs.splice(position - 1, 1);
            playlist.updatedAt = new Date();
            await playlist.save();

            const embed = new EmbedBuilder()
                .setColor(client.color)
                .setTitle(`${client.emoji.tick} Song Removed`)
                .setDescription(`Successfully removed **[${removedSong.title}](${client.config.ssLink})** from playlist: **${playlistName}**`)
                .setThumbnail(removedSong.thumbnail)
                .addFields(
                    { name: "Position", value: `${position}`, inline: true },
                    { name: "Duration", value: client.formatTime(removedSong.duration), inline: true },
                    { name: "Remaining Songs", value: `${playlist.songs.length}`, inline: true }
                )
                .setFooter({ text: `Removed by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Error removing song from playlist:", error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | An error occurred while removing the song!`)
                ],
            });
        }
    },
};
