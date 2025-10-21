
const { EmbedBuilder } = require("discord.js");
const Playlist = require("../../models/PlaylistSchema");

module.exports = {
    name: "pl-create",
    aliases: ["playlist-create", "createplaylist"],
    category: "Playlist",
    description: "Create a new playlist",
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

        if (playlistName.length > 50) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | Playlist name must be less than 50 characters!`)
                ],
            });
        }

        try {
            // Check if playlist already exists
            const existingPlaylist = await Playlist.findOne({
                userId: message.author.id,
                name: playlistName
            });

            if (existingPlaylist) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} | A playlist with name **${playlistName}** already exists!`)
                    ],
                });
            }

            // Create new playlist
            const newPlaylist = new Playlist({
                userId: message.author.id,
                name: playlistName,
                songs: [],
                createdAt: new Date(),
                updatedAt: new Date()
            });

            await newPlaylist.save();

            const embed = new EmbedBuilder()
                .setColor(client.color)
                .setTitle(`${client.emoji.tick} Playlist Created`)
                .setDescription(`Successfully created playlist: **${playlistName}**`)
                .setFooter({ text: `Created by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Error creating playlist:", error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | An error occurred while creating the playlist!`)
                ],
            });
        }
    },
};
