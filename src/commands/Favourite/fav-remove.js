const { EmbedBuilder } = require("discord.js");
const UserProfile = require("../../models/UserProfileSchema.js");

module.exports = {
    name: "fav-remove",
    description: "Remove a track from your favorites list by its index",
    category: "Music",
    aliases: ["fremove", "favorites-remove"],
    run: async (client, message, args, prefix) => {
        const index = parseInt(args[0]) - 1;
        const userId = message.author.id;
        let userProfile = await UserProfile.findOne({ userId });

        if (!userProfile || !userProfile.favorites.length) {
            const embed = new EmbedBuilder()
                .setColor("#FF5555")
                .setAuthor({ name: "Favorites Manager", iconURL: client.user.displayAvatarURL() })
                .setTitle("⛔ No Favorites Found")
                .setDescription(
                    "You don't have any tracks in your favorites list to remove!\n" +
                    `Use \`${prefix}fav-add\` to add a track to your favorites.`
                )
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }

        if (isNaN(index) || index < 0 || index >= userProfile.favorites.length) {
            const embed = new EmbedBuilder()
                .setColor("#FFA500")
                .setAuthor({ name: "Favorites Manager", iconURL: client.user.displayAvatarURL() })
                .setTitle("⚠️ Invalid Track Number")
                .setDescription(
                    `Please provide a valid track number between 1 and ${userProfile.favorites.length}.\n` +
                    `Use \`${prefix}fav-list\` to view your favorites with their numbers.`
                )
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

        const removed = userProfile.favorites.splice(index, 1)[0];
        await userProfile.save();

        const embed = new EmbedBuilder()
            .setColor("#1DB954") // Spotify green
            .setAuthor({ name: "Favorites Manager", iconURL: client.user.displayAvatarURL() })
            .setTitle("🗑️ Track Removed from Favorites")
            .setDescription(
                `Successfully removed **${removed.title.length > 50 ? removed.title.slice(0, 47) + "..." : removed.title}** from your favorites!`
            )
            .setThumbnail(removed.thumbnail || client.user.displayAvatarURL())
            .addFields(
                { name: "Artist", value: removed.author.length > 30 ? removed.author.slice(0, 27) + "..." : removed.author, inline: true },
                { name: "Duration", value: formatDuration(removed.duration), inline: true },
                {
                    name: "View Updated Favorites",
                    value: `Use \`${prefix}fav-list\` to see your updated favorites list.`,
                    inline: false
                }
            )
            .setFooter({ text: `Removed by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        return message.channel.send({ embeds: [embed] });
    }
};