
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const Playlist = require("../../models/PlaylistSchema");

module.exports = {
    name: "pl-list",
    aliases: ["playlist-list", "listplaylists", "playlists"],
    category: "Playlist",
    description: "List all your playlists",
    args: false,
    usage: "",
    userPerms: [],
    owner: false,
    run: async (client, message, args, prefix) => {
        try {
            const playlists = await Playlist.find({ userId: message.author.id }).sort({ createdAt: -1 });

            if (!playlists.length) {
                const embed = new EmbedBuilder()
                    .setColor(client.color)
                    .setTitle(`${message.author.username}'s Playlists`)
                    .setDescription(`You don't have any playlists yet!\nUse \`${prefix}pl-create <name>\` to create one.`)
                    .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
                    .setTimestamp();

                return message.reply({ embeds: [embed] });
            }

            const itemsPerPage = 10;
            const pages = Math.ceil(playlists.length / itemsPerPage);
            let currentPage = 0;

            const generateEmbed = (page) => {
                const start = page * itemsPerPage;
                const end = start + itemsPerPage;
                const currentPlaylists = playlists.slice(start, end);

                const embed = new EmbedBuilder()
                    .setColor(client.color)
                    .setTitle(`${message.author.username}'s Playlists`)
                    .setDescription(
                        currentPlaylists.map((playlist, index) => {
                            const totalDuration = playlist.songs.reduce((acc, song) => acc + song.duration, 0);
                            return `**${start + index + 1}.** ${playlist.name}\n└ Songs: **${playlist.songs.length}** | Duration: **${client.formatTime(totalDuration)}**`;
                        }).join('\n\n')
                    )
                    .setFooter({ 
                        text: `Page ${page + 1}/${pages} | Total Playlists: ${playlists.length}`, 
                        iconURL: message.author.displayAvatarURL() 
                    })
                    .setTimestamp();

                return embed;
            };

            const generateButtons = (page) => {
                return new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId("first")
                        .setLabel("First")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId("previous")
                        .setLabel("Previous")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === 0),
                    new ButtonBuilder()
                        .setCustomId("next")
                        .setLabel("Next")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === pages - 1),
                    new ButtonBuilder()
                        .setCustomId("last")
                        .setLabel("Last")
                        .setStyle(ButtonStyle.Secondary)
                        .setDisabled(page === pages - 1)
                );
            };

            const initialEmbed = generateEmbed(currentPage);
            const components = pages > 1 ? [generateButtons(currentPage)] : [];

            const msg = await message.reply({ embeds: [initialEmbed], components });

            if (pages > 1) {
                const collector = msg.createMessageComponentCollector({ time: 60000 });

                collector.on('collect', async (interaction) => {
                    if (interaction.user.id !== message.author.id) {
                        return interaction.reply({ content: "You can't use these buttons!", ephemeral: true });
                    }

                    switch (interaction.customId) {
                        case 'first':
                            currentPage = 0;
                            break;
                        case 'previous':
                            currentPage = Math.max(0, currentPage - 1);
                            break;
                        case 'next':
                            currentPage = Math.min(pages - 1, currentPage + 1);
                            break;
                        case 'last':
                            currentPage = pages - 1;
                            break;
                    }

                    await interaction.update({
                        embeds: [generateEmbed(currentPage)],
                        components: [generateButtons(currentPage)]
                    });
                });

                collector.on('end', () => {
                    msg.edit({ components: [] });
                });
            }
        } catch (error) {
            console.error("Error listing playlists:", error);
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(client.color)
                        .setDescription(`${client.emoji.cross} | An error occurred while fetching playlists!`)
                ],
            });
        }
    },
};
