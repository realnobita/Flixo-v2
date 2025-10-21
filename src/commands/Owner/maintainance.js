const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const MaintenanceSchema = require("../../models/MaintenanceSchema.js");

module.exports = {
  name: "maintainance",
  aliases: ["maint"],
  description: "Toggle maintenance mode (developer only).",
  category: "Owner",
  cooldowns: 5,
  userPermissions: [],
  botPermissions: [],

  execute: async (client, message, args) => {
    // Restrict to developer only
    if (message.author.id !== "1380026050104397825") {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FFB800")
            .setDescription("This command is restricted to the developer only.")
            .setFooter({ text: `Flixo | Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp(),
        ],
      });
    }

    const action = args[0]?.toLowerCase();
    if (!["on", "off"].includes(action)) {
      const usage = new EmbedBuilder()
        .setColor(client.color || "#FFB800")
        .setTitle("Maintenance Setup")
        .setDescription(
          `Usage:\n` +
          `• \`maint on\` - Enable maintenance mode\n` +
          `• \`maint off\` - Disable maintenance mode`
        )
        .setFooter({ text: `Flixo | Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      return message.channel.send({ embeds: [usage] });
    }

    try {
      let maint = await MaintenanceSchema.findOne({ _id: "global" });
      if (!maint) {
        maint = new MaintenanceSchema({ _id: "global", isMaintenance: false });
      }

      if (action === "on" && maint.isMaintenance) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FFB800")
              .setDescription("Maintenance mode is already enabled.")
              .setFooter({ text: `Flixo | Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
              .setTimestamp(),
          ],
        });
      }

      if (action === "off" && !maint.isMaintenance) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FFB800")
              .setDescription("Maintenance mode is already disabled.")
              .setFooter({ text: `Flixo | Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
              .setTimestamp(),
          ],
        });
      }

      maint.isMaintenance = action === "on";
      await maint.save();

      const embed = new EmbedBuilder()
        .setColor("#00FF00")
        .setTitle("Maintenance Mode Updated")
        .setDescription(
          `Maintenance mode has been turned **${action.toUpperCase()}**.\n` +
          `Commands will ${action === "on" ? "now be restricted for non-developers." : "be available to all users."}`
        )
        .setFooter({ text: `Flixo | Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      return message.channel.send({ embeds: [embed] });
    } catch (error) {
      console.error(`[ERROR] Failed to update maintenance mode:`, error);
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription("An error occurred while updating maintenance mode. Please try again.")
            .setFooter({ text: `Flixo | Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp(),
        ],
      });
    }
  },
};