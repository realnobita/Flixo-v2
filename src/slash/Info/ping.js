const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Shows the bot's ping"),

  /**
   * 
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {import('../../structure/client')} client 
   */
  async execute(interaction, client) {
    const sent = await interaction.reply({ content: "🏓 Pinging...", fetchReply: true });

    const ping = sent.createdTimestamp - interaction.createdTimestamp;

    const embed = new EmbedBuilder()
      .setColor("000000")
      .setDescription(`📡 API Latency: \`${client.ws.ping}ms\`\n🛰️ Bot Latency: \`${ping}ms\``);

    await interaction.editReply({ content: "", embeds: [embed] });
  }
};
