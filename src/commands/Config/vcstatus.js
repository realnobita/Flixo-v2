const VcStatus = require("../../models/vcstatus");
const { EmbedBuilder, PermissionsBitField } = require("discord.js");

const OWNER_ID = process.env.OWNER_ID || "123456789012345678";

module.exports = {
  name: "voicestatus",
  aliases: ["vstatus"],
  description: "Manage voice channel status sync for this server",
  usage: "<enable|disable|status>",
  inVc: true,
  sameVc: true,
  vote: false,
  premium: false,

  run: async (client, message, args) => {
    const sub = (args[0] || "").toLowerCase();

    if (!sub || !["enable", "disable", "status"].includes(sub)) {
      const usageEmbed = new EmbedBuilder()
        .setColor("#FF5555")
        .setAuthor({ name: "Voice Status Manager", iconURL: client.user.displayAvatarURL() })
        .setTitle("⚠️ Invalid Command Usage")
        .setDescription(
          "Please provide a valid subcommand.\n\n**Available Subcommands:**\n" +
          "• `enable` - Enable voice status sync\n" +
          "• `disable` - Disable voice status sync\n" +
          "• `status` - Check current voice status sync settings"
        )
        .addFields({
          name: "Example",
          value: `\`voicestatus enable\`\n\`voicestatus disable\`\n\`voicestatus status\``
        })
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      return message.reply({ embeds: [usageEmbed] });
    }

    // 📊 Status Check
    if (sub === "status") {
      const config = await VcStatus.findOne({ guildId: message.guild.id });
      const statusEmbed = new EmbedBuilder()
        .setColor(config?.enabled ? "#43B581" : "#FF5555")
        .setAuthor({ name: "Voice Status Sync", iconURL: client.user.displayAvatarURL() })
        .setTitle("📡 Voice Status Configuration")
        .setDescription(
          config?.enabled
            ? "✅ **Voice status sync is ENABLED** in this server.\nVoice channel activities will be synchronized."
            : "❌ **Voice status sync is DISABLED** in this server.\nVoice channel activities are not being synchronized."
        )
        .addFields({
          name: "Last Updated",
          value: config?.updatedAt ? `<t:${Math.floor(config.updatedAt.getTime() / 1000)}:R>` : "Never"
        })
        .setFooter({ text: `Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      return message.reply({ embeds: [statusEmbed] });
    }

    // 🔐 Permission Check
    if (
      message.author.id !== OWNER_ID &&
      !message.member.permissions.has(PermissionsBitField.Flags.ManageChannels)
    ) {
      const permEmbed = new EmbedBuilder()
        .setColor("#FFA500")
        .setAuthor({ name: "Permission Denied", iconURL: client.user.displayAvatarURL() })
        .setTitle("🔒 Insufficient Permissions")
        .setDescription(
          "You need the **Manage Channels** permission to modify voice status settings."
        )
        .setFooter({ text: "Voice Status Manager", iconURL: client.user.displayAvatarURL() })
        .setTimestamp();
      return message.reply({ embeds: [permEmbed] });
    }

    // ⚠️ Bot Missing Permission
    const botMember = message.guild.members.me;
    if (!botMember.permissions.has(PermissionsBitField.Flags.ManageChannels)) {
      await VcStatus.findOneAndUpdate(
        { guildId: message.guild.id },
        { enabled: false },
        { upsert: true, new: true }
      );

      const botPermEmbed = new EmbedBuilder()
        .setColor("#FFA500")
        .setAuthor({ name: "Bot Permission Issue", iconURL: client.user.displayAvatarURL() })
        .setTitle("⚠️ Missing Bot Permissions")
        .setDescription(
          "I need the **Manage Channels** permission to enable voice status sync.\nVoice status sync has been automatically disabled."
        )
        .setFooter({ text: "Voice Status Manager", iconURL: client.user.displayAvatarURL() })
        .setTimestamp();
      return message.reply({ embeds: [botPermEmbed] });
    }

    // ✅ Enable / ❌ Disable
    const enabled = sub === "enable";
    await VcStatus.findOneAndUpdate(
      { guildId: message.guild.id },
      { enabled, updatedAt: new Date() },
      { upsert: true, new: true }
    );

    const toggleEmbed = new EmbedBuilder()
      .setColor(enabled ? "#43B581" : "#FF5555")
      .setAuthor({ name: "Voice Status Updated", iconURL: client.user.displayAvatarURL() })
      .setTitle(enabled ? "✅ Voice Status Enabled" : "❌ Voice Status Disabled")
      .setDescription(
        enabled
          ? "Voice status sync has been **enabled**.\nVoice channel activities will now be synchronized across the server."
          : "Voice status sync has been **disabled**.\nVoice channel activities will no longer be synchronized."
      )
      .addFields({
        name: "Action Performed By",
        value: `<@${message.author.id}>`
      })
      .setFooter({ text: "Voice Status Manager", iconURL: client.user.displayAvatarURL() })
      .setTimestamp();

    return message.reply({ embeds: [toggleEmbed] });
  },
};