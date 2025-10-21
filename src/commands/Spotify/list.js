// spotify-list.js
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const Playlist = require("../../models/UserProfileSchema.js");

module.exports = {
    name: "spotify-list",
    aliases: ["sp-list", "spotify-playlists", "sp-playlists"],
    category: "Spotify",
    description: "List playlists of the linked Spotify user and let you select one",
    args: false,
    usage: "",
    userPerms: [],
    owner: false,
    run: async (client, message) => {
        try {
            const doc = await Playlist.findOne({ userId: message.author.id, type: "spotify-user" });
            if (!doc || !doc.url) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder().setColor(client.color).setDescription("No Spotify profile linked. Use `sp-attach <user_url>`.")
                    ],
                });
            }

            // Try to fetch live playlists via a helper on client if present
            let playlists = [];
            if (client.spotifyFetchUserPlaylists && typeof client.spotifyFetchUserPlaylists === "function") {
                try {
                    playlists = await client.spotifyFetchUserPlaylists(doc.url);
                    // normalize: [{ id, name, url, trackCount, thumbnail }]
                } catch (e) {
                    console.warn("spotifyFetchUserPlaylists failed, falling back to cache:", e);
                }
            }

            // fallback to cached playlists in DB
            if (!playlists || playlists.length === 0) playlists = doc.playlists || [];

            if (!playlists.length) {
                return message.reply({
                    embeds: [
                        new EmbedBuilder().setColor(client.color).setDescription("No playlists found for this Spotify user (no cache and no API).")
                    ],
                });
            }

            // Build description (first 10 items)
            const lines = playlists.slice(0, 10).map((p, i) => `\`${i + 1}.\` **${p.name}** — ${p.trackCount || "?"} tracks`);
            const embed = new EmbedBuilder()
                .setColor(client.color)
                .setTitle("Spotify Playlists")
                .setDescription(lines.join("\n"))
                .setFooter({ text: "Reply with the number to use that playlist, or use the menu below." });

            // build select menu options
            const options = playlists.slice(0, 25).map((p, i) => ({
                label: p.name.length > 100 ? p.name.slice(0, 97) + "..." : p.name,
                value: String(i), // index
                description: `${p.trackCount || "?"} tracks`
            }));

            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`sp_select_${message.author.id}_${Date.now()}`)
                    .setPlaceholder("Select a playlist to play/import/info")
                    .addOptions(options)
            );

            const sent = await message.reply({ embeds: [embed], components: [row] });

            // create collector (30s)
            const filter = (i) => i.user.id === message.author.id && i.customId.startsWith(`sp_select_${message.author.id}`);
            const collector = sent.createMessageComponentCollector({ filter, time: 30000, max: 1 });

            collector.on("collect", async interaction => {
                await interaction.deferUpdate();
                const idx = parseInt(interaction.values[0], 10);
                const selected = playlists[idx];
                if (!selected) return interaction.followUp({ content: "Selected playlist not found.", ephemeral: true });

                // Reply with a small menu of actions (play / import / info)
                const actionEmbed = new EmbedBuilder()
                    .setColor(client.color)
                    .setTitle(selected.name)
                    .setDescription(`Selected playlist: [Open](${selected.url})\nTracks: ${selected.trackCount || "?"}`)
                    .addFields(
                        { name: "Actions", value: `Use commands:\n\`sp-play ${idx + 1}\` — play\n\`sp-import ${idx + 1} <targetPlaylistName>\` — import\n\`sp-info ${idx + 1}\` — info` }
                    );

                await interaction.followUp({ embeds: [actionEmbed] });
            });

            collector.on("end", collected => {
                // disable menu after timeout
                try {
                    const disabledRow = new ActionRowBuilder().addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId(`sp_select_disabled_${Date.now()}`)
                            .setPlaceholder("Selection expired")
                            .setDisabled(true)
                    );
                    sent.edit({ components: [disabledRow] }).catch(() => null);
                } catch {}
            });

        } catch (err) {
            console.error("spotify-list error:", err);
            return message.reply({ embeds: [new EmbedBuilder().setColor(client.color).setDescription("Failed to list playlists.")] });
        }
    },
};