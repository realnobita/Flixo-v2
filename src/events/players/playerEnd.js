const { autoplayHandler } = require("../../handlers/autoplay.js");

module.exports = async (client, player, track, payload) => {
  try {
    // Skip if the player is already destroyed
    if (!player || player.destroyed) return;

    // If there are still tracks in the queue, no need for autoplay
    if (player.queue.size > 0) return;

    // Send a message when the track ends
    const textChannel = client.channels.cache.get(player.textChannel);
    if (textChannel) {
      await textChannel.send({
        content: `**${track.title}** has finished playing! ${
          player.data.get("autoplay")
            ? "Autoplay is enabled, searching for the next track..."
            : "The queue is now empty."
        }`
      });
    }

    // Run autoplay handler
    await autoplayHandler(player, client, track);

  } catch (err) {
    client.logger?.error(`[TrackEnd Error] ${err.message}`);
  }
};