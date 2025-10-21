const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("support")
    .setDescription("Get the bot's support link"),

  /**
   * 
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {import('../../structure/client')} client 
   */
  async execute(interaction, client) {
    const supportLink = "https://discord.gg/HaD5sYEj8w"; // replace with your server invite

    // Always reply ephemeral (only user sees in servers)
    await interaction.reply({
      content: `${supportLink}`,
      ephemeral: true,
    });
  }
};
