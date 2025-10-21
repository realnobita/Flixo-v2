const { EmbedBuilder, WebhookClient } = require("discord.js");
const noPrefix = require("../../models/NoPrefixSchema.js");
const permNoPrefix = require("../../models/permNoPrefixSchema.js");

// Server restriction
const SUPPORT_SERVER_ID = "1371496371147902986";

// Webhook for logging
const LOG_WEBHOOK = new WebhookClient({ url: "http://discord.com/api/webhooks/1396892799764529324/_8M0rHEtdZOy5V4d-LGKpnx0ZyzQCCNfXGwyENvUsfPk42kkJjbclNr4iHhyCwUWpRYD" });

module.exports = {
  name: "noprefix",
  aliases: ["prime"],
  description: "Add or remove users from the NoPrefix list",
  category: "Owner",
  owner: false,

  run: async (client, message, args, prefix) => {
    if (message.guild.id !== SUPPORT_SERVER_ID) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setAuthor({ name: "Access Denied" })
            .setDescription("This command can only be used in the support server.")
        ]
      });
    }

    const hasPermAccess = await permNoPrefix.findOne({ userId: message.author.id });
    if (!hasPermAccess) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setAuthor({ name: "Permission Required" })
            .setDescription("You need permanent **NoPrefix Access** to use this command.")
        ]
      });
    }

    try {
      let userId;
      if (message.mentions.users.size) {
        userId = message.mentions.users.first().id;
      } else if (args[1] && !isNaN(args[1])) {
        userId = args[1];
      }

      if (!args[0]) {
        const embed = new EmbedBuilder()
          .setColor(client.color)
          .setTitle("⚡ NoPrefix Command Usage")
          .setDescription(
            `**Add User:** \`${prefix}noprefix add <user> [time/staff] [reason]\`\n` +
            `• Default = **7 days** if not specified\n\n` +
            `**Remove User:** \`${prefix}noprefix remove <user> [reason]\`\n\n` +
            `**Special:**\n` +
            `• Use \`staff\` keyword for permanent access\n\n` +
            `**Time Formats:**\n` +
            `• \`min\` - Minutes (e.g., 30min)\n` +
            `• \`h\` - Hours (e.g., 12h)\n` +
            `• \`d\` - Days (e.g., 7d)\n` +
            `• \`m\` - Months (30 days, e.g., 1m)\n` +
            `• \`y\` - Years (e.g., 1y)`
          )
          .setFooter({ text: "NoPrefix Manager" });
        return message.channel.send({ embeds: [embed] });
      }

      // =================== ADD ===================
      if (args[0].toLowerCase() === "add") {
        if (!userId) {
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(client.color)
                .setAuthor({ name: "Invalid Usage" })
                .setDescription("Please mention a valid user or ID.\n\n**Usage:** `noprefix add <user> [time/staff] [reason]`")
            ]
          });
        }

        let duration = null;
        let expireAt = null;
        let timeSpecified = args[2] || false;
        let reason = args.slice(timeSpecified ? 3 : 2).join(" ") || "No reason provided";

        if (timeSpecified && timeSpecified.toLowerCase() === "staff") {
          duration = null;
          expireAt = null;
        } else if (timeSpecified) {
          const timeMatch = timeSpecified.match(/^(\d+)(min|h|d|m|y)$/);
          if (timeMatch) {
            const value = parseInt(timeMatch[1]);
            const unit = timeMatch[2];
            const multipliers = { 
              min: 60000, 
              h: 3600000, 
              d: 86400000, 
              m: 2592000000, 
              y: 31557600000 
            };
            duration = value * multipliers[unit];
            expireAt = Date.now() + duration;
          } else {
            return message.channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(client.color)
                  .setAuthor({ name: "Invalid Time Format" })
                  .setDescription("Please use: `min`, `h`, `d`, `m`, or `y`.\n\n**Example:** `noprefix add @user 7d Reason here` or `noprefix add @user staff Reason here`")
              ]
            });
          }
        } else {
          duration = 7 * 86400000;
          expireAt = Date.now() + duration;
          reason = args.slice(2).join(" ") || "No reason provided";
        }

        const existingData = await noPrefix.findOne({ userId });
        const targetUser = await client.users.fetch(userId);
        const executor = message.author;

        if (existingData) {
          await noPrefix.findOneAndUpdate({ userId }, { expireAt });

          const embed = new EmbedBuilder()
            .setColor("Green")
            .setAuthor({ name: "NoPrefix Updated" })
            .setDescription(`**User:** ${targetUser.tag} (${targetUser.id})\n**Duration:** ${formatDuration(duration)}\n**Reason:** ${reason}`)
            .setThumbnail(targetUser.displayAvatarURL())
            .setFooter({ text: `Updated by ${executor.globalName || executor.username}`, iconURL: executor.displayAvatarURL() });

          message.channel.send({ embeds: [embed] });

          logWebhook("Updated", targetUser, executor, duration, reason, message.guild);
          return;
        }

        await noPrefix.create({ userId, expireAt });

        const embed = new EmbedBuilder()
          .setColor("Green")
          .setAuthor({ name: "NoPrefix Added" })
          .setDescription(`**User:** ${targetUser.tag} (${targetUser.id})\n**Duration:** ${formatDuration(duration)}${!timeSpecified ? " (Default)" : ""}\n**Reason:** ${reason}`)
          .setThumbnail(targetUser.displayAvatarURL())
          .setFooter({ text: `Added by ${executor.globalName || executor.username}`, iconURL: executor.displayAvatarURL() });

        message.channel.send({ embeds: [embed] });

        logWebhook("Added", targetUser, executor, duration, reason, message.guild);
        return;
      }

      // =================== REMOVE ===================
      if (args[0].toLowerCase() === "remove") {
        if (!userId) {
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(client.color)
                .setAuthor({ name: "Invalid Usage" })
                .setDescription("Please mention a valid user or ID.\n\n**Usage:** `noprefix remove <user> [reason]`")
            ]
          });
        }

        let reason = args.slice(2).join(" ") || "No reason provided";

        const data = await noPrefix.findOne({ userId });
        if (!data) {
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor("Red")
                .setAuthor({ name: "Not Found" })
                .setDescription("This user doesn't have **NoPrefix Access**.")
            ]
          });
        }

        await noPrefix.findOneAndDelete({ userId });
        const targetUser = await client.users.fetch(userId);
        const executor = message.author;

        const embed = new EmbedBuilder()
          .setColor("Red")
          .setAuthor({ name: "NoPrefix Removed" })
          .setDescription(`**User:** ${targetUser.tag} (${targetUser.id})\n**Reason:** ${reason}`)
          .setThumbnail(targetUser.displayAvatarURL())
          .setFooter({ text: `Removed by ${executor.globalName || executor.username}`, iconURL: executor.displayAvatarURL() });

        message.channel.send({ embeds: [embed] });

        logWebhook("Removed", targetUser, executor, null, reason, message.guild);
        return;
      }

      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setAuthor({ name: "Invalid Subcommand" })
            .setDescription("Use `add` or `remove`.\n\n**Example:** `noprefix add @user 7d Reason`")
        ]
      });

    } catch (error) {
      console.log(error);
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("Red")
            .setAuthor({ name: "Error" })
            .setDescription("An unexpected error occurred while executing this command.")
        ]
      });
    }
  }
};

function formatDuration(ms) {
  if (!ms) return "Permanent";

  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 60000) % 60;
  const hours = Math.floor(ms / 3600000) % 24;
  const days = Math.floor(ms / 86400000);

  let parts = [];
  if (days) parts.push(`${days} day${days > 1 ? "s" : ""}`);
  if (hours) parts.push(`${hours} hour${hours > 1 ? "s" : ""}`);
  if (minutes) parts.push(`${minutes} minute${minutes > 1 ? "s" : ""}`);
  if (seconds && !days && !hours) parts.push(`${seconds} second${seconds > 1 ? "s" : ""}`);

  return parts.length ? parts.join(", ") : "0 seconds";
}

// Webhook logger
function logWebhook(action, targetUser, executor, duration, reason, guild) {
  if (!LOG_WEBHOOK) return;

  const embed = new EmbedBuilder()
    .setColor(action === "Removed" ? "Red" : "Green")
    .setTitle(`NoPrefix ${action}`)
    .setThumbnail(targetUser.displayAvatarURL())
    .addFields(
      { name: "User", value: `${targetUser.tag} (${targetUser.id})`, inline: false },
      { name: "Executor", value: `${executor.tag} (${executor.id})`, inline: false },
      { name: "Duration", value: formatDuration(duration), inline: true },
      { name: "Reason", value: reason, inline: false },
      { name: "Server", value: `${guild.name}\nOwner: <@${guild.ownerId}>\nMembers: ${guild.memberCount}`, inline: false },
      { name: "Timestamp", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
    );

  LOG_WEBHOOK.send({ embeds: [embed] }).catch(() => {});
}