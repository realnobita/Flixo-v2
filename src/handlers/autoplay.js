const searchManager = require("./searchManager.js");

async function autoplayHandler(player, client, track) {
  try {
    const autoplayEnabled = player.data.get("autoplay");
    if (!autoplayEnabled || !track) return null;

    const requester = player.data.get("requester") || client.user;

    let res = null;

    // Check if the track is from YouTube
    const isYouTube = track.uri.includes('youtube.com') || track.uri.includes('youtu.be');

    if (isYouTube && track.identifier) {
      const ytRelated = `https://www.youtube.com/watch?v=${track.identifier}&list=RD${track.identifier}`;
      res = await player.search(ytRelated, { requester, source: "youtube" });
    }

    // Fallback: Custom search manager
    if (!res || !res.tracks?.length) {
      res = await searchManager(client, track, requester);
    }

    if (!res || !res.tracks?.length) {
      return null;
    }

    const baseId = track.identifier;
    const baseTitle = track.title.toLowerCase();

    let filtered = res.tracks.filter(
      t => t.identifier !== baseId && !t.title.toLowerCase().includes(baseTitle)
    );

    if (!filtered.length) {
      // If all filtered out, take the first non-base track
      filtered = res.tracks.filter(t => t.identifier !== baseId);
    }

    if (!filtered.length) {
      return null;
    }

    // Add only one song
    const nextTrack = filtered[0];
    await player.queue.add(nextTrack);

    if (!player.playing && !player.paused) player.play();

    return nextTrack;
  } catch (err) {
    // Silently handle errors without console output
    return null;
  }
}

module.exports = { autoplayHandler };