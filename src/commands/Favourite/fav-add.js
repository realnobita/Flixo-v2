const { EmbedBuilder } = require("discord.js");
const UserProfile = require("../../models/UserProfileSchema.js");

module.exports = {
    name: "fav-add",
    description: "Add the currently playing track to your favorites",
    category: "Music",
    aliases: ["fadd", "favorite-add"],
    run: async (client, message) => {
        const player = client.manager.players.get(message.guild.id);
        if (!player || !player.queue.current) {
            const embed = new EmbedBuilder()
                .setColor("#FF5555")
                .setAuthor({ name: "Favorites Manager", iconURL: client.user.displayAvatarURL() })
                .setTitle("⛔ No Track Playing")
                .setDescription("There is no track currently playing to add to your favorites.")
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }

        const userId = message.author.id;
        let userProfile = await UserProfile.findOne({ userId });
        if (!userProfile) {
            userProfile = new UserProfile({ userId, favorites: [] });
        }

        const track = player.queue.current;
        const exists = userProfile.favorites.some(fav => fav.uri === track.uri);
        if (exists) {
            const embed = new EmbedBuilder()
                .setColor("#FFA500")
                .setAuthor({ name: "Favorites Manager", iconURL: client.user.displayAvatarURL() })
                .setTitle("⚠️ Track Already Favorited")
                .setDescription(`**${track.title.length > 50 ? track.title.slice(0, 47) + "..." : track.title}** is already in your favorites!`)
                .addFields({
                    name: "View Your Favorites",
                    value: `Use \`${message.prefix}favorites\` to see your favorite tracks.`
                })
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }

        const formatDuration = (ms) => {
            const totalSeconds = Math.floor(ms / 1000);
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;
            return `${minutes}:${seconds.toString().padStart(2, "0")}`;
        };

        userProfile.favorites.push({
            title: track.title,
            author: track.author,
            uri: track.uri,
            duration: track.duration
        });
        await userProfile.save();

        const embed = new EmbedBuilder()
            .setColor("#1DB954") // Spotify green
            .setAuthor({ name: "Favorites Manager", iconURL: client.user.displayAvatarURL() })
            .setTitle("❤️ Track Added to Favorites")
            .setDescription(`Successfully added **${track.title.length > 50 ? track.title.slice(0, 47) + "..." : track.title}** to your favorites!`)
            .setThumbnail(track.thumbnail || client.user.displayAvatarURL())
            .addFields(
                { name: "Artist", value: track.author.length > 30 ? track.author.slice(0, 27) + "..." : track.author, inline: true },
                { name: "Duration", value: formatDuration(track.duration), inline: true },
                { name: "View Favorites", value: `Use \`${message.prefix}favorites\` to see your list.`, inline: false }
            )
            .setFooter({ text: `Added by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        return message.channel.send({ embeds: [embed] });
    }
};