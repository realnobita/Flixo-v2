
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Playlist = require("../../models/PlaylistSchema");

module.exports = {
    name: "pl-delete",
    aliases: ["playlist-delete", "deleteplaylist"],
    category: "Playlist",
    description: "Delete a playlist",
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
                        .setDescription(`${client.emoji.cross} | Please provide a playlist name to delete!`)
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

            const confirmEmbed = new EmbedBuilder()
                .setColor(client.color)
                .setTitle("⚠️ Confirm Deletion")
                .setDescription(`Are you sure you want to delete playlist: **${playlistName}**?\n\nThis playlist contains **${playlist.songs.length}** songs and this action cannot be undone!`)
                .setFooter({ text: "You have 30 seconds to confirm", iconURL: message.author.displayAvatarURL() });

            const confirmButtons = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("confirm_delete")
                    .setLabel("Yes, Delete")
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId("cancel_delete")
                    .setLabel("Cancel")
                    .setStyle(ButtonStyle.Secondary)
            );

            const msg = await message.reply({ embeds: [confirmEmbed], components: [confirmButtons] });

            const collector = msg.createMessageComponentCollector({ time: 30000 });

            collector.on('collect', async (interaction) => {
                if (interaction.user.id !== message.author.id) {
                    return interaction.reply({ content: "You can't use these buttons!", ephemeral: true });
                }

                if (interaction.customId === 'confirm_delete') {
                    await Playlist.deleteOne({ _id: playlist._id });

                    const successEmbed = new EmbedBuilder()
                        .setColor(client.color)
                        .setTitle(`${client.emoji.tick} Playlist Deleted`)
                        .setDescription(`Successfully deleted playlist: **${playlistName}**`)
                        .addFields({ name: "Songs Removed", value: `${playlist.songs.length}`, inline: true })
                        .setFooter({ text: `Deleted by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                        .setTimestamp();

                    await interaction.update({ embeds: [successEmbed], components: [] });
                } else {
                    const cancelEmbed = new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.tick} | Playlist deletion cancelled.`);

                    await interaction.update({ embeds: [cancelEmbed], components: [] });
                }

                collector.stop();
            });

            collector.on('end', (collected) => {
                if (!collected.size) {
                    const timeoutEmbed = new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | Confirmation timed out. Playlist deletion cancelled.`);

                    msg.edit({ embeds: [timeoutEmbed], components: [] });
                }
            });
        } catch (error) {
            console.error("Error deleting playlist:", error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | An error occurred while deleting the playlist!`)
                ],
            });
        }
    },
};
