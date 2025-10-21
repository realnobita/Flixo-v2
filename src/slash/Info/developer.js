const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("developer")
    .setDescription("Get the bot's developer id/link"),

  /**
   * 
   * @param {import('discord.js').ChatInputCommandInteraction} interaction 
   * @param {import('../../structure/client')} client 
   */
  async execute(interaction, client) {
    const devLink = "https://discord.com/users/1380026050104397825"; // replace with your server invite

    // Always reply ephemeral (only user sees in servers)
    await interaction.reply({
      content: `[ᴍʀ ɴᴏʙɪᴛᴀ](${devLink})`,
      ephemeral: false,
    });
  }
};
