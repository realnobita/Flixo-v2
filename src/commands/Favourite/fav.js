const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "fav",
    aliases: ["favorites", "favs"],
    description: "Manage your favorite tracks",
    category: "Music",
    run: async (client, message, args, prefix) => {
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setColor("#1DB954") // Spotify green
                .setAuthor({ name: "Favorites Manager", iconURL: client.user.displayAvatarURL() })
                .setTitle("🎵 Favorites Command Help")
                .setDescription(
                    "Manage your favorite tracks with the following subcommands:"
                )
                .setThumbnail(client.user.displayAvatarURL())
                .addFields(
                    {
                        name: `${prefix}fav add`,
                        value: "Add the currently playing track to your favorites.",
                        inline: false
                    },
                    {
                        name: `${prefix}fav remove <number>`,
                        value: "Remove a track from your favorites by its index.",
                        inline: false
                    },
                    {
                        name: `${prefix}fav list`,
                        value: "View your favorite tracks list with pagination.",
                        inline: false
                    },
                    {
                        name: `${prefix}fav clear`,
                        value: "Clear all tracks from your favorites list.",
                        inline: false
                    },
                    {
                        name: `${prefix}fav play [shuffle]`,
                        value: "Play all your favorite tracks (optionally shuffled).",
                        inline: false
                    },
                    {
                        name: "💡 Tip",
                        value: `Use \`${prefix}fav list\` to see track numbers for removal or playback. Some commands require you to be in a voice channel.`,
                        inline: false
                    }
                )
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            return message.channel.send({ embeds: [embed] });
        }

        const sub = args[0].toLowerCase();
        const cmd = client.commands.get(`fav-${sub}`);
        if (cmd) {
            return cmd.run(client, message, args.slice(1), prefix);
        } else {
            const embed = new EmbedBuilder()
                .setColor("#FF5555")
                .setAuthor({ name: "Favorites Manager", iconURL: client.user.displayAvatarURL() })
                .setTitle("⛔ Invalid Subcommand")
                .setDescription(
                    `The subcommand \`${sub}\` is not valid.\n\n` +
                    `**Available Subcommands:**\n` +
                    `• \`${prefix}fav add\` - Add current track\n` +
                    `• \`${prefix}fav remove <number>\` - Remove a track\n` +
                    `• \`${prefix}fav list\` - View favorites\n` +
                    `• \`${prefix}fav clear\` - Clear all favorites\n` +
                    `• \`${prefix}fav play [shuffle]\` - Play all favorites`
                )
                .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                .setTimestamp();

            return message.channel.send({ embeds: [embed] });
        }
    }
};