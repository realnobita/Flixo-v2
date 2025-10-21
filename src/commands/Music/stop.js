const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "stop",
  description: `Stops the player and clears the queue.`,
  category: "Music",
  cooldown: 5,
  inVc: true,
  sameVc: true,
  dj: true,

  run: async (client, message, args, prefix, player) => {
    if (!player) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setDescription("<:floovi_cross:1382029455601569904> No active player found in this server.")
            .setColor(client.color)
        ]
      });
    }

    // 🧹 Cleanup
    player.setLoop("none");
    player.data.set("autoplay", false);
    player.queue.clear();

    // 🧼 Delete Now Playing message
    const nowPlayingMessage = player.data.get("nplaying");
    if (nowPlayingMessage) {
      const channel = client.channels.cache.get(nowPlayingMessage.channelId);
      if (channel) {
        const msg = await channel.messages.fetch(nowPlayingMessage.id).catch(() => null);
        if (msg && msg.deletable) {
          await msg.delete().catch(() => {});
        }
      }
      player.data.delete("nplaying");
    }

    // 🔁 Skip or Destroy
    if (player.queue.size === 0) {
      player.destroy();
    } else {
      player.stop();
    }

    // ✅ Send embed with footer
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(client.color)
          .setDescription(`<:floovi_tick:1381965556277710860> Music playback has been **stopped** and the queue has been **cleared**.`)
          .setFooter({
            text: `Thank you for using Floovi! Feel free to queue more tracks anytime.`,
            iconURL: client.user.displayAvatarURL()
          })
      ]
    });
  }
};