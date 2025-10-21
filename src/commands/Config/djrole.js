const {
  Message,
  PermissionFlagsBits,
  EmbedBuilder,
  PermissionsBitField,
} = require("discord.js");
const dj = require("../../models/DjroleSchema.js");

module.exports = {
  name: "djrole",
  aliases: ["dj"],
  description: "Configure the DJ role system for your server",
  userPermissions: PermissionFlagsBits.ManageGuild,
  botPermissions: PermissionFlagsBits.Speak,
  cooldowns: 5,
  category: "Config",
  premium: false,
  vote: false,
  run: async (client, message, args, prefix) => {
    // Permission check
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("⛔ Insufficient Permissions")
        .setDescription("You need the **Manage Server** permission to use this command.")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
      return message.channel.send({ embeds: [embed] });
    }

    try {
      const data = await dj.findOne({ guildId: message.guild.id });

      // No arguments provided
      if (!args[0]) {
        const embed = new EmbedBuilder()
          .setColor(client.color || "#00FF00")
          .setTitle("🎵 DJ Role Configuration")
          .setDescription(
            `Configure the DJ role system for music commands.\n\n**Available Commands:**\n` +
            `\`${prefix}djrole add <role_id>\` - Set up a DJ role\n` +
            `\`${prefix}djrole remove\` - Remove the DJ role system`
          )
          .addFields({
            name: "Current Status",
            value: data ? `DJ Role: <@&${data.roleId}>` : "No DJ role configured"
          })
          .setTimestamp()
          .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
        return message.channel.send({ embeds: [embed] });
      }

      // Add DJ role
      if (args[0].toLowerCase() === "add") {
        if (data) {
          const embed = new EmbedBuilder()
            .setColor("#FFA500")
            .setTitle("⚠️ DJ Role Already Configured")
            .setDescription(
              `This server already has a DJ role system enabled.\n` +
              `Current DJ Role: <@&${data.roleId}>\n` +
              `Use \`${prefix}djrole remove\` to disable it first.`
            )
            .setTimestamp()
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
          return message.channel.send({ embeds: [embed] });
        }

        const role = message.guild.roles.cache.get(args[1]?.replace(/[<@&>]/g, ""));
        if (!role || isNaN(args[1]?.replace(/[<@&>]/g, ""))) {
          const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("⛔ Invalid Role")
            .setDescription(
              "Please provide a valid role ID or mention.\n" +
              `Example: \`${prefix}djrole add @DJ\` or \`${prefix}djrole add 123456789012345678\` `
            )
            .setTimestamp()
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
          return message.channel.send({ embeds: [embed] });
        }

        await dj.create({
          guildId: message.guild.id,
          roleId: role.id,
        });

        const embed = new EmbedBuilder()
          .setColor("#00FF00")
          .setTitle("✅ DJ Role Configured")
          .setDescription(
            `Successfully set up the DJ role system!\n` +
            `DJ Role: <@&${role.id}>\n` +
            `Members with this role can now use restricted music commands.`
          )
          .setTimestamp()
          .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
        return message.channel.send({ embeds: [embed] });
      }

      // Remove DJ role
      if (args[0].toLowerCase() === "remove") {
        if (!data) {
          const embed = new EmbedBuilder()
            .setColor("#FFA500")
            .setTitle("⚠️ No DJ Role System")
            .setDescription(
              "This server doesn't have a DJ role system configured.\n" +
              `Use \`${prefix}djrole add <role_id>\` to set one up.`
            )
            .setTimestamp()
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
          return message.channel.send({ embeds: [embed] });
        }

        await dj.findOneAndDelete({ guildId: message.guild.id });
        const embed = new EmbedBuilder()
          .setColor("#00FF00")
          .setTitle("✅ DJ Role System Removed")
          .setDescription("Successfully removed the DJ role system.\nAll music commands are now available to everyone.")
          .setTimestamp()
          .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
        return message.channel.send({ embeds: [embed] });
      }

      // Invalid argument
      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("⛔ Invalid Command")
        .setDescription(
          `Please use a valid subcommand.\n\n**Available Commands:**\n` +
          `\`${prefix}djrole add <role_id>\` - Set up a DJ role\n` +
          `\`${prefix}djrole remove\` - Remove the DJ role system`
        )
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
      return message.channel.send({ embeds: [embed] });

    } catch (error) {
      console.error(`Error in djrole command: ${error}`);
      const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("⛔ Error")
        .setDescription("An unexpected error occurred while processing the command. Please try again later.")
        .setTimestamp()
        .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });
      return message.channel.send({ embeds: [embed] });
    }
  },
};