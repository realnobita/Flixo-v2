const { EmbedBuilder, PermissionsBitField } = require("discord.js");
const IgnoreChannelSchema = require("../../models/IgnoreChannelSchema.js");
const IgnoreCommandSchema = require("../../models/IgnoreCommandSchema.js");
const IgnoreBypassSchema = require("../../models/IgnoreBypassSchema.js");

module.exports = {
  name: "ignore",
  aliases: ["ign"],
  description: "Add or remove ignored channels, commands, or bypass users.",
  category: "Config",
  cooldowns: 5,
  userPermissions: [PermissionsBitField.Flags.ManageGuild],
  botPermissions: [PermissionsBitField.Flags.ManageGuild],

  execute: async (client, message, args) => {
    const type = args[0]?.toLowerCase(); // channel/command/bypass
    const action = args[1]?.toLowerCase(); // add/remove
    const target = args.slice(2).join(" "); // the actual thing

    // Invalid usage
    if (!["channel", "command", "bypass"].includes(type) || !["add", "remove"].includes(action) || !target) {
      const usage = new EmbedBuilder()
        .setColor(client.color || "#FFB800")
        .setTitle("Ignore Setup")
        .setDescription(
          `Usage:\n` +
          `• \`ign channel add #channel\`\n` +
          `• \`ign channel remove #channel\`\n` +
          `• \`ign command add <commandName>\`\n` +
          `• \`ign command remove <commandName>\`\n` +
          `• \`ign bypass add <user>\`\n` +
          `• \`ign bypass remove <user>\``
        )
        .setFooter({ text: `Flixo | Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      return message.channel.send({ embeds: [usage] });
    }

    // =========================
    // CHANNEL HANDLER
    // =========================
    if (type === "channel") {
      const channel = message.mentions.channels.first() || message.guild.channels.cache.get(target);
      if (!channel) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color || "#FFB800")
              .setDescription("Please provide a valid channel mention or ID.")
          ],
        });
      }

      if (action === "add") {
        const exists = await IgnoreChannelSchema.findOne({ guildId: message.guild.id, channelId: channel.id });
        if (exists) {
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor("#FFB800")
                .setDescription(`${channel} is already ignored.`)
            ]
          });
        }

        await IgnoreChannelSchema.create({ guildId: message.guild.id, channelId: channel.id });
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("#00FF00")
              .setTitle("Channel Ignored")
              .setDescription(`${channel} has been added to ignored channels.`)
              .setFooter({ text: `Flixo | Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
              .setTimestamp(),
          ],
        });
      }

      if (action === "remove") {
        const exists = await IgnoreChannelSchema.findOne({ guildId: message.guild.id, channelId: channel.id });
        if (!exists) {
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor("#FFB800")
                .setDescription(`${channel} is not in ignored channels.`)
            ]
          });
        }

        await IgnoreChannelSchema.deleteOne({ guildId: message.guild.id, channelId: channel.id });
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("#00FF00")
              .setTitle("Channel Unignored")
              .setDescription(`${channel} has been removed from ignored channels.`)
              .setFooter({ text: `Flixo | Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
              .setTimestamp(),
          ],
        });
      }
    }

    // =========================
    // COMMAND HANDLER
    // =========================
    if (type === "command") {
      const cmdName = target.toLowerCase();

      // Prevent ignoring the 'ignore' command or its alias 'ign'
      if (cmdName === "ignore" || cmdName === "ign") {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("#FFB800")
              .setDescription("The `ignore` command cannot be ignored.")
          ],
        });
      }

      // Check command in client.mcommands
      const cmd = client.mcommands.get(cmdName) || client.mcommands.find(c => c.aliases?.includes(cmdName));

      if (!cmd) {
        // Simplified command validation
        const validCommand = client.mcommands.some(
          c => c.name.toLowerCase() === cmdName || (c.aliases && c.aliases.includes(cmdName))
        );
        if (!validCommand) {
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor("#FFB800")
                .setDescription(`Invalid command name: \`${cmdName}\`. Please use a valid command or alias.`)
            ],
          });
        }
      }

      const commandName = cmd ? cmd.name : cmdName; // Use the main command name if found, else use input

      if (action === "add") {
        const exists = await IgnoreCommandSchema.findOne({ guildId: message.guild.id, command: commandName });
        if (exists) {
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor("#FFB800")
                .setDescription(`\`${commandName}\` is already ignored.`)
            ],
          });
        }

        await IgnoreCommandSchema.create({ guildId: message.guild.id, command: commandName });
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("#00FF00")
              .setTitle("Command Ignored")
              .setDescription(`Command \`${commandName}\` has been added to ignored commands.`)
              .setFooter({ text: `Flixo | Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
              .setTimestamp(),
          ],
        });
      }

      if (action === "remove") {
        const exists = await IgnoreCommandSchema.findOne({ guildId: message.guild.id, command: commandName });
        if (!exists) {
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor("#FFB800")
                .setDescription(`\`${commandName}\` is not in ignored commands.`)
            ],
          });
        }

        await IgnoreCommandSchema.deleteOne({ guildId: message.guild.id, command: commandName });
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("#00FF00")
              .setTitle("Command Unignored")
              .setDescription(`Command \`${commandName}\` has been removed from ignored commands.`)
              .setFooter({ text: `Flixo | Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
              .setTimestamp(),
          ],
        });
      }
    }

    // =========================
    // BYPASS HANDLER
    // =========================
    if (type === "bypass") {
      const user = message.mentions.users.first() || await client.users.fetch(target).catch(() => null);
      if (!user) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("#FFB800")
              .setDescription("Please provide a valid user mention or ID.")
          ],
        });
      }

      if (action === "add") {
        const exists = await IgnoreBypassSchema.findOne({ guildId: message.guild.id, userId: user.id });
        if (exists) {
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor("#FFB800")
                .setDescription(`${user.tag} is already in the bypass list.`)
            ],
          });
        }

        await IgnoreBypassSchema.create({ guildId: message.guild.id, userId: user.id });
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("#00FF00")
              .setTitle("Bypass Added")
              .setDescription(`${user.tag} has been added to the ignore bypass list.`)
              .setFooter({ text: `Flixo | Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
              .setTimestamp(),
          ],
        });
      }

      if (action === "remove") {
        const exists = await IgnoreBypassSchema.findOne({ guildId: message.guild.id, userId: user.id });
        if (!exists) {
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor("#FFB800")
                .setDescription(`${user.tag} is not in the bypass list.`)
            ],
          });
        }

        await IgnoreBypassSchema.deleteOne({ guildId: message.guild.id, userId: user.id });
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor("#00FF00")
              .setTitle("Bypass Removed")
              .setDescription(`${user.tag} has been removed from the ignore bypass list.`)
              .setFooter({ text: `Flixo | Requested by ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
              .setTimestamp(),
          ],
        });
      }
    }
  },
};