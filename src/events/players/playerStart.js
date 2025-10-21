const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { KazagumoTrack } = require("kazagumo"); 
const setplayer = require("../../models/SetupPlayerSchema.js");
const setup = require("../../models/SetupSchema.js");
const updateMessage = require("../../handlers/setupQueue.js");
const { autoplayHandler } = require("../../handlers/autoplay.js"); // ✅ import here

module.exports = async (client) => {
    client.manager.on("playerStart", async (player, track) => {
        try {
            const playerConfig = await setplayer.findOne({ guildId: player.guildId });
            const mode = playerConfig?.playerMode || 'classic';
            const updateData = await setup.findOne({ guildId: player.guildId });

            await updateMessage(player, client, track);

            if (updateData && updateData.channelId == player.textId) return;

            // ✅ store previous/current track
            player.previousTrack = player.currentTrack || null;
            player.currentTrack = track;

            if (mode === "classic") {
                const messageChannel = client.channels.cache.get(player.textId);
                if (!messageChannel) return;

                const embed = buildEmbed(track, client, player, messageChannel.guild);
                const components = getPlayerButtons(player);
                const nplaying = await messageChannel.send({ embeds: [embed], components }).catch(console.error);
                if (!nplaying) return;

                player.data.set("nplaying", nplaying);

                const filter = (i) =>
                    i.guild.members.me.voice.channel &&
                    i.guild.members.me.voice.channelId === i.member.voice.channelId;
                const collector = nplaying.createMessageComponentCollector({ filter, time: 3600000 });

                collector.on("collect", async (interaction) => {
                    const id = interaction.customId;
                    let feedbackMessage;
                    await interaction.deferUpdate();

                    switch (id) {
                        case "pause":
                            await player.pause(!player.paused);
                            feedbackMessage = `The track has been successfully ${player.paused ? "paused" : "resumed"}.`;
                            break;

                        case "skip": {
    const botVc = interaction.guild.members.me.voice.channelId;
    const userVc = interaction.member.voice.channelId;

    if (!userVc || userVc !== botVc) {
        return interaction.followUp({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`<:floovi_warn:1382779289858211880> You must be in the same voice channel as me to skip a track.`)
                    .setColor("Red")
            ],
            ephemeral: true
        });
    }

    // ⏳ Loading embed bhejna
    const loadingMsg = await interaction.channel.send({
        embeds: [
            new EmbedBuilder()
                .setDescription(`<a:Loading:1341044182852173824> Skipping track...`)
                .setColor(client.color)
        ]
    });

    if (player.queue.size > 0) {
        // ✅ Normal skip to next queued song
        await player.skip();
        await loadingMsg.edit({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`<:forward:1382664277839577189> Skipped to the next track in the queue.`)
                    .setColor(client.color)
                    .setFooter({ text: `Executed by ${interaction.user.tag}` }),
            ],
        });
    } else if (player.data.get("autoplay")) {
        // ✅ Autoplay when queue empty
        const baseTrack = player.currentTrack || player.previousTrack;
        const nextTrack = await autoplayHandler(player, client, baseTrack);

        if (nextTrack) {
            await player.play(nextTrack);
            await loadingMsg.edit({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`<:forward:1382664277839577189> Autoplay is now playing **${nextTrack.title}**`)
                        .setColor(client.color)
                        .setFooter({ text: `Executed by ${interaction.user.tag}` }),
                ],
            });
        } else {
            await player.destroy();
            await loadingMsg.edit({
                embeds: [
                    new EmbedBuilder()
                        .setDescription(`<:floovi_cross:1382029455601569904> No related track found for autoplay. Stopping playback.`)
                        .setColor("Red")
                        .setFooter({ text: `Executed by ${interaction.user.tag}` }),
                ],
            });
        }
    } else {
        // ✅ Stop when no more tracks
        await player.destroy();
        await loadingMsg.edit({
            embeds: [
                new EmbedBuilder()
                    .setDescription(`<:floovi_tick:1381965556277710860> No more tracks in queue. Stopping playback.`)
                    .setColor(client.color)
                    .setFooter({ text: `Executed by ${interaction.user.tag}` }),
            ],
        });
    }

    break;
}


                        case "back": {
                            const previous = player.previousTrack;
                            if (previous) {
                                const fixedTrack = KazagumoTrack.create(
                                    player,
                                    previous,
                                    previous.requester || interaction.user
                                );
                                await player.play(fixedTrack);
                                feedbackMessage = `Playing previous track.`;
                            } else {
                                feedbackMessage = `No previous track available.`;
                            }
                            break;
                        }

                        case "shuffle":
                            player.queue.shuffle();
                            feedbackMessage = `Queue has been shuffled.`;
                            break;

                        case "loop":
                            const newLoop = player.loop === "track" ? "none" : "track";
                            await player.setLoop(newLoop);
                            feedbackMessage = `Loop mode has been ${newLoop === "track" ? "enabled" : "disabled"}.`;
                            break;
                    }

                    if (feedbackMessage) {
                        const feedback = await interaction.channel.send({
                            embeds: [
                                new EmbedBuilder()
                                    .setDescription(feedbackMessage)
                                    .setColor(client.color)
                                    .setFooter({ text: `Executed by ${interaction.user.tag}` }),
                            ],
                        });
                        setTimeout(() => feedback.delete().catch(() => { }), 5000);
                    }

                    await nplaying.edit({ components: getPlayerButtons(player) }).catch(() => { });
                });

                collector.on("end", async (_, reason) => {
                    if (reason === "time") {
                        const disabledComponents = getPlayerButtons(player, true);
                        await nplaying.edit({ components: disabledComponents }).catch(() => { });
                    }
                });
            }
        } catch (e) {
            console.error("playerStart error:", e);
        }
    });
};

function buildEmbed(track, client, player, guild) {
    const duration = formatMs(track.length);

    const platformEmojis = {
        youtube: "<:ytm:1382661482516320348>",
        spotify: "<:spotify:1382662749527740596>",
        soundcloud: "<:soundcloud:1382661331454398567>",
        applemusic: "<:applemusic:1382661554675384330>",
        deezer: "<:Deezer:1382661703224791052>",
        default: "<:music:1341030939135836294>"
    };

    const source = track.sourceName?.toLowerCase() || "default";
    const platformText = platformEmojis[source] || platformEmojis["default"];

    return new EmbedBuilder()
        .setDescription(`${platformText} **Now Playing**\n\`Name:${track.title}\`\n\`Duration: ${duration}\``)
        .setThumbnail(track.thumbnail || null)
        .setColor(client.color)
        .setFooter({
            text: `Requested by ${track.requester?.tag || "Flixo"}`,
            iconURL: guild.iconURL({ dynamic: true }) || client.user.displayAvatarURL(),
        });
}

function getPlayerButtons(player, disabled = false) {
    return [
        new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId("loop")
                .setEmoji("<:loop:1382664510019735553>")
                .setStyle(player.loop === "track" ? ButtonStyle.Success : ButtonStyle.Secondary)
                .setDisabled(disabled),
            new ButtonBuilder()
                .setCustomId("back")
                .setEmoji("<:Back:1382664275012620300>")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled),
            new ButtonBuilder()
                .setCustomId("pause")
                .setEmoji(player.paused ? "<:resume:1382664368994648126>" : "<:Pause:1382664369975853116>")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled),
            new ButtonBuilder()
                .setCustomId("skip")
                .setEmoji("<:forward:1382664277839577189>")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled),
            new ButtonBuilder()
                .setCustomId("shuffle")
                .setEmoji("<:shuffle:1384497021477589042>")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(disabled),
        ),
    ];
}

function formatMs(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0
        ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
        : `${m}:${String(sec).padStart(2, '0')}`;
}
