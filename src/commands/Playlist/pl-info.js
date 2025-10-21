
const { EmbedBuilder } = require("discord.js");
const Playlist = require("../../models/PlaylistSchema");

module.exports = {
    name: "pl-info",
    aliases: ["playlist-info", "playlistinfo"],
    category: "Playlist",
    description: "Show information about a playlist",
    args: true,
    usage: "<playlist_name>",
    userPerms: [],
    owner: false,
    run: async (client, message, args, prefix) => {
        const playlistName = args.join(" ");
        
        if (!playlistName) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | Please provide a playlist name!`)
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

            const totalDuration = playlist.songs.reduce((acc, song) => acc + song.duration, 0);
            const averageDuration = playlist.songs.length > 0 ? totalDuration / playlist.songs.length : 0;

            const embed = new EmbedBuilder()
                .setColor(client.color)
                .setTitle(`<:dn_playlist:1385267432582676583> Playlist: ${playlist.name}`)
                .setDescription(playlist.description || "No description set")
                .addFields(
                    { name: "Songs", value: `${playlist.songs.length}`, inline: true },
                    { name: "Total Duration", value: client.formatTime(totalDuration), inline: true },
                    { name: "Average Duration", value: client.formatTime(averageDuration), inline: true },
                    { name: "Created", value: `<t:${Math.floor(playlist.createdAt.getTime() / 1000)}:R>`, inline: true },
                    { name: "Last Updated", value: `<t:${Math.floor(playlist.updatedAt.getTime() / 1000)}:R>`, inline: true },
                    { name: "Public", value: playlist.isPublic ? "Yes" : "No", inline: true }
                );

            if (playlist.songs.length > 0) {
                const recentSongs = playlist.songs
                    .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
                    .slice(0, 5)
                    .map((song, index) => `**${index + 1}.** [${song.title}](${client.config.ssLink}) - \`${client.formatTime(song.duration)}\``)
                    .join('\n');

                embed.addFields({ name: "Recent Songs", value: recentSongs, inline: false });
            }

            embed.setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                 .setTimestamp();

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Error fetching playlist info:", error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | An error occurred while fetching playlist information!`)
                ],
            });
        }
    },
};
