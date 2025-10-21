// spotify-play.js
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const updateQueue = require("../../handlers/setupQueue.js");
const Playlist = require("../../models/UserProfileSchema.js");

module.exports = {
  name: "spotify-play",
  aliases: ["sp-play"],
  description: "Play music directly from Spotify (track, playlist, or user playlists)",
  category: "Spotify",
  inVc: true,
  sameVc: true,
  dj: true,
  premium: false,

  run: async (client, message, args, prefix) => {
    const channel = message.member.voice.channel;
    const query = args.join(" ");

    if (!query) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setTitle("Missing Query")
            .setDescription(
              `<:floovi_cross:1382029455601569904> | Please provide a Spotify song name, track URL, or playlist.`
            ),
        ],
      });
    }

    // create lavalink player
    const player = await client.manager.createPlayer({
      guildId: message.guild.id,
      textId: message.channel.id,
      voiceId: channel.id,
      volume: 80,
      deaf: true,
      shardId: message.guild.shardId,
    });

    let tracks = [];

    try {
      if (query.includes("open.spotify.com/track/")) {
        // === Direct track link ===
        if (!client.spotifyFetchTrack)
          throw new Error("Missing client.spotifyFetchTrack implementation");

        const trackInfo = await client.spotifyFetchTrack(query);
        if (trackInfo)
          tracks.push(trackInfo);

      } else if (query.includes("open.spotify.com/playlist/")) {
        // === Playlist link ===
        if (!client.spotifyFetchPlaylistTracks)
          throw new Error("Missing client.spotifyFetchPlaylistTracks implementation");

        tracks = await client.spotifyFetchPlaylistTracks(query);

      } else if (query.includes("open.spotify.com/user/")) {
        // === Direct user profile link not supported for play (must attach first) ===
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setDescription(
                `Please attach this Spotify user first with \`${prefix}sp-attach <url>\` and then use \`${prefix}sp-play <number>\`.`
              ),
          ],
        });

      } else if (!isNaN(query)) {
        // === User's attached profile playlist number ===
        const doc = await Playlist.findOne({
          userId: message.author.id,
          type: "spotify-user",
        });

        if (!doc || !doc.url) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.color)
                .setDescription(
                  `No Spotify profile linked. Use \`${prefix}sp-attach <user_url>\`.`
                ),
            ],
          });
        }

        let playlists = [];
        if (client.spotifyFetchUserPlaylists) {
          playlists = await client.spotifyFetchUserPlaylists(doc.url);
        }
        if (!playlists || playlists.length === 0) playlists = doc.playlists || [];

        const idx = parseInt(query, 10) - 1;
        if (isNaN(idx) || idx < 0 || idx >= playlists.length) {
          return message.reply({
            embeds: [
              new EmbedBuilder()
                .setColor(client.color)
                .setDescription(
                  `Invalid playlist number. Use \`${prefix}sp-list\` to see available playlists.`
                ),
            ],
          });
        }

        const selected = playlists[idx];
        if (!client.spotifyFetchPlaylistTracks)
          throw new Error("Missing client.spotifyFetchPlaylistTracks implementation");

        tracks = await client.spotifyFetchPlaylistTracks(selected.id);

      } else {
        // === Search query (Spotify search only) ===
        if (!client.spotifySearch)
          throw new Error("Missing client.spotifySearch implementation");

        const searchResult = await client.spotifySearch(query);
        if (searchResult && searchResult.length)
          tracks.push(searchResult[0]);
      }
    } catch (e) {
      console.error("Spotify fetch error:", e);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(
              `<:floovi_cross:1382029455601569904> | Failed to fetch from Spotify.`
            ),
        ],
      });
    }

    if (!tracks || tracks.length === 0) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(
              `<:floovi_cross:1382029455601569904> | No results found on Spotify for **${query}**.`
            ),
        ],
      });
    }

    // add to queue
    for (const t of tracks) {
      const result = await client.manager.search(`${t.title} ${t.artist}`, {
        requester: message.author,
      });
      if (result.tracks.length) player.queue.add(result.tracks[0]);
    }

    if (!player.playing && !player.paused) player.play();

    const embed = new EmbedBuilder()
      .setColor(client.color)
      .setTitle("Spotify Tracks Queued")
      .setDescription(
        `<:floovi_tick:1381965556277710860> | Added **${tracks.length}** song(s) from Spotify.`
      )
      .setFooter({ text: `Requested by ${message.author.tag}` });

    await updateQueue(message.guild, player.queue);
    return message.reply({ embeds: [embed] });
  },
};