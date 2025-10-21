const { EmbedBuilder } = require("discord.js");
const UserProfile = require("../../models/UserProfileSchema.js");

module.exports = {
    name: "fav-clear",
    description: "Clear all tracks from your favorites list",
    category: "Music",
    aliases: ["fclear", "favorites-clear"],
    run: async (client, message) => {
        const userId = message.author.id;
        let userProfile = await UserProfile.findOne({ userId });

        if (!userProfile || !userProfile.favorites.length) {
            const embed = new EmbedBuilder()
                .setColor("#FF5555")
                .setAuthor({ name: "Favorites Manager", iconURL: client.user.displayAvatarURL() })
                .setTitle("⛔ No Favorites Found")
                .setDescription("You don't have any tracks in your favorites list to clear!")
                .addFields({
                    name: "Add a Favorite",
                    value: `Use \`${message.prefix}fav-add\` to add a track to your favorites.`
                })
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();
            return message.channel.send({ embeds: [embed] });
        }

        userProfile.favorites = [];
        await userProfile.save();

        const embed = new EmbedBuilder()
            .setColor("#1DB954") // Spotify green
            .setAuthor({ name: "Favorites Manager", iconURL: client.user.displayAvatarURL() })
            .setTitle("🗑️ Favorites Cleared")
            .setDescription("Successfully cleared all tracks from your favorites list!")
            .addFields({
                name: "Action Performed By",
                value: `<@${message.author.id}>`
            })
            .setFooter({ text: `Cleared by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp();

        return message.channel.send({ embeds: [embed] });
    }
};