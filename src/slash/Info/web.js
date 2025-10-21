const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("website")
    .setDescription("Get the bot's website link"),

  /**
   * 
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {import('../../structure/client')} client 
   */
  async execute(interaction, client) {
    const webLink = "https://flixoo.vercel.app"; // replace with your server invite

    // Always reply ephemeral (only user sees in servers)
    await interaction.reply({
      content: `${webLink}`,
      ephemeral: false,
    });
  }
};
