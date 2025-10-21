
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
    name: "pl-savequeue",
    aliases: ["playlist-savequeue", "savequeue"],
    category: "Playlist",
    description: "Save current queue to a playlist",
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

        const player = client.manager.players.get(message.guild.id);
        if (!player || (!player.queue.current && !player.queue.length)) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | There's no music playing or queue is empty!`)
                ],
            });
        }

        try {
            let playlist = await Playlist.findOne({
                userId: message.author.id,
                name: playlistName
            });

            const tracksToSave = [];
            
            // Add current playing song
            if (player.queue.current) {
                tracksToSave.push(player.queue.current);
            }
            
            // Add queued songs
            tracksToSave.push(...player.queue);

            const songsToAdd = tracksToSave.map(track => ({
                title: track.title,
                url: track.uri,
                duration: track.length,
                thumbnail: track.thumbnail,
                author: track.author,
                addedAt: new Date()
            }));

            if (playlist) {
                // Add to existing playlist
                const existingUrls = new Set(playlist.songs.map(s => s.url));
                const newSongs = songsToAdd.filter(song => !existingUrls.has(song.url));
                
                playlist.songs.push(...newSongs);
                playlist.updatedAt = new Date();
                await playlist.save();

                const embed = new EmbedBuilder()
                    .setColor(client.color)
                    .setTitle(`${client.emoji.tick} Queue Saved`)
                    .setDescription(`Successfully added **${newSongs.length}** new songs to existing playlist: **${playlistName}**`)
                    .addFields(
                        { name: "Total Songs in Queue", value: `${tracksToSave.length}`, inline: true },
                        { name: "New Songs Added", value: `${newSongs.length}`, inline: true },
                        { name: "Total in Playlist", value: `${playlist.songs.length}`, inline: true }
                    )
                    .setFooter({ text: `Saved by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            } else {
                // Create new playlist
                playlist = new Playlist({
                    userId: message.author.id,
                    name: playlistName,
                    songs: songsToAdd,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                await playlist.save();

                const totalDuration = songsToAdd.reduce((acc, song) => acc + song.duration, 0);

                const embed = new EmbedBuilder()
                    .setColor(client.color)
                    .setTitle(`${client.emoji.tick} Queue Saved`)
                    .setDescription(`Successfully created new playlist: **${playlistName}** with current queue`)
                    .addFields(
                        { name: "Songs Saved", value: `${songsToAdd.length}`, inline: true },
                        { name: "Total Duration", value: formatDuration(totalDuration), inline: true },
                        { name: "Playlist Created", value: "New", inline: true }
                    )
                    .setFooter({ text: `Saved by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }
        } catch (error) {
            console.error("Error saving queue to playlist:", error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | An error occurred while saving the queue!`)
                ],
            });
        }
    },
};
