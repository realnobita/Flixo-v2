// src/events/interactionCreate.js
module.exports = (client) => {
    client.on("interactionCreate", async (interaction) => {
      try {
        if (interaction.isChatInputCommand()) {
          const command = client.slashCommands.get(interaction.commandName);
          if (!command) return;
          await command.execute(interaction, client);
          return;
        }
  
        if (interaction.isModalSubmit()) {
          // Route to the report command's modal handler
          const reportCmd = client.slashCommands.get("report");
          if (reportCmd?.modalHandler) {
            await reportCmd.modalHandler(interaction);
          }
        }
      } catch (err) {
        console.error("interaction error:", err);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: "❌ Something went wrong while executing that interaction.",
            ephemeral: true,
          }).catch(() => {});
        }
      }
    });
  };
  