// events/interactionCreate.js
module.exports = async (client, interaction) => {
  if (!interaction.isChatInputCommand()) return; // ✅ only handle slash commands

  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction, client);
  } catch (err) {
    console.error(`[SLASH CMD ERROR]:`, err);
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp({ content: "⚠️ Something went wrong.", ephemeral: true });
    } else {
      await interaction.reply({ content: "⚠️ Something went wrong.", ephemeral: true });
    }
  }
};
