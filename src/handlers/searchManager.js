// searchManager.js

async function searchManager(client, query, requester) {
  try {
    if (!query) {
      console.log("[SearchManager] ❌ No query provided");
      return null;
    }

    const urlPatterns = {
      spotify: /^(?:https?:\/\/)?(?:open\.spotify\.com)\/(?:intl-[a-z]{2}\/)?(track|playlist|album)\/([a-zA-Z0-9]+)/,
      deezer: /^(?:https?:\/\/)?(?:www\.)?deezer\.com\/(?:[a-z]{2}\/)?(track|playlist|album)\/(\d+)/,
      apple: /^(?:https?:\/\/)?(?:music\.apple\.com)\/([a-z]{2}\/)?(album|playlist)\/([^/?]+)\/(\d+)/,
      soundcloud: /^(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/[\w-]+\/[\w-]+/,
      youtube: /^(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\//,
    };

    const originalInput = typeof query === "string" ? query : query.uri || query.title || "";
    let res = null;

    console.log(`[SearchManager] 🔍 Searching: ${originalInput}`);

    // ✅ Detect URLs → use specific source
    if (urlPatterns.spotify.test(originalInput)) {
      console.log("[SearchManager] 🎵 Source detected: Spotify");
      res = await client.manager.search(originalInput, { requester, source: "spotify" });
    } else if (urlPatterns.deezer.test(originalInput)) {
      console.log("[SearchManager] 🎵 Source detected: Deezer");
      res = await client.manager.search(originalInput, { requester, source: "deezer" });
    } else if (urlPatterns.apple.test(originalInput)) {
      console.log("[SearchManager] 🎵 Source detected: Apple Music");
      res = await client.manager.search(originalInput, { requester, source: "apple" });
    } else if (urlPatterns.soundcloud.test(originalInput)) {
      console.log("[SearchManager] 🎵 Source detected: SoundCloud");
      res = await client.manager.search(originalInput, { requester, source: "soundcloud" });
    } else if (urlPatterns.youtube.test(originalInput)) {
      console.log("[SearchManager] 🎵 Source detected: YouTube");
      res = await client.manager.search(originalInput, { requester, source: "youtube" });
    } else {
      // ✅ Plain text search → let Lavalink decide best source
      console.log("[SearchManager] 🎵 Text query detected, using multi-source search");
      res = await client.manager.search(originalInput, { requester });
    }

    // Fallback: try "artist - title"
    if ((!res || !res.tracks?.length) && query?.author && query?.title) {
      const q = `${query.author} - ${query.title}`;
      console.log(`[SearchManager] ⚠️ No results, retrying with artist+title: ${q}`);
      res = await client.manager.search(q, { requester });
    }

    if (!res || !res.tracks?.length) {
      console.log("[SearchManager] ❌ No results found at all");
      return null;
    }

    console.log(`[SearchManager] ✅ Found ${res.tracks.length} results`);
    return res;
  } catch (err) {
    console.error("[SearchManager Error]", err);
    return null;
  }
}

module.exports = searchManager;
