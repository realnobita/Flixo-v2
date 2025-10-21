const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "resume",
  aliases: ["resume"],
  description: `Resume the paused music.`,
  category: "Music",
  cooldown: 5,
  inVc: true,
  sameVc: true,
  dj: true,
  premium: false,

  run: async (client, message, args, prefix, player) => {
    const tick = "<:floovi_tick:1381965556277710860>";
    const cross = "<:floovi_cross:1382029455601569904>";

    if (!player) {
      const embed = new EmbedBuilder()
        .setColor(client.color)
        .setDescription(`${cross} | No music is currently playing in this server.\nStart a song to use the resume command.`);
      return message.reply({ embeds: [embed] });
    }

    if (!player.paused) {
      const embed = new EmbedBuilder()
        .setColor(client.color)
        .setDescription(`${cross} | The music is already playing.\nUse the \`pause\` command if you want to stop temporarily.`);
      return message.reply({ embeds: [embed] });
    }

    await player.pause(false);

    const embed = new EmbedBuilder()
      .setColor(client.color)
      .setDescription(`${tick} | Music playback has been resumed.\nSit back and enjoy the vibe!`);

    return message.reply({ embeds: [embed] });
  },
};