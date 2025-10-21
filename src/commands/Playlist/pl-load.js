const { EmbedBuilder } = require("discord.js");
const Playlist = require("../../models/PlaylistSchema");

module.exports = {
    name: "pl-load",
    aliases: ["playlist-load", "loadplaylist"],
    category: "Playlist",
    description: "Load a playlist to the queue",
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
                        .setDescription(`${client.emoji.cross} | Please provide a playlist name to load!`)
                ],
            });
        }

        const { channel } = message.member.voice;
        if (!channel) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | You need to be in a voice channel to load a playlist!`)
                ],
            });
        }

        const botChannel = message.guild.members.me.voice.channel;
        if (botChannel && botChannel.id !== channel.id) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | I'm already connected to a different voice channel!`)
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

            if (!playlist.songs.length) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(client.color)
                            .setDescription(`${client.emoji.cross} | Playlist **${playlistName}** is empty!`)
                    ],
                });
            }

            const player = await client.manager.createPlayer({
                guildId: message.guild.id,
                textId: message.channel.id,
                voiceId: channel.id,
                deaf: true
            });

            let loadedSongs = 0;
            const failedSongs = [];

            for (const song of playlist.songs) {
                try {
                    const result = await client.manager.search(song.url, { requester: message.author });
                    if (result.tracks.length > 0) {
                        player.queue.add(result.tracks[0]);
                        loadedSongs++;
                    } else {
                        failedSongs.push(song.title);
                    }
                } catch (error) {
                    failedSongs.push(song.title);
                }
            }

            if (!player.playing && !player.paused) {
                player.play();
            }

            const embed = new EmbedBuilder()
                .setColor(client.color)
                .setTitle(`${client.emoji.tick} Playlist Loaded`)
                .setDescription(`Successfully loaded **${loadedSongs}** songs from playlist: **${playlistName}**`)
                .addFields({ name: "Total Songs", value: `${playlist.songs.length}`, inline: true });

            if (failedSongs.length > 0) {
                embed.addFields({ 
                    name: "Failed to Load", 
                    value: `${failedSongs.length} songs`, 
                    inline: true 
                });
            }

            embed.setFooter({ text: `Loaded by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                 .setTimestamp();

            return message.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Error loading playlist:", error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | An error occurred while loading the playlist!`)
                ],
            });
        }
    },
};