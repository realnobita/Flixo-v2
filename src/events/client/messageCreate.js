const {
  EmbedBuilder,
  PermissionsBitField,
  Collection,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  WebhookClient,
} = require("discord.js");

const PrefixSchema = require("../../models/PrefixSchema.js");
const BlacklistUserSchema = require("../../models/BlacklistUserSchema.js");
const BlacklistServerSchema = require("../../models/BlacklistServerSchema.js");
const NoPrefixSchema = require("../../models/NoPrefixSchema.js");
const DjRoleSchema = require("../../models/DjroleSchema.js");
const SetupSchema = require("../../models/SetupSchema.js");
const IgnoreChannelSchema = require("../../models/IgnoreChannelSchema.js");
const IgnoreCommandSchema = require("../../models/IgnoreCommandSchema.js");
const IgnoreBypassSchema = require("../../models/IgnoreBypassSchema.js");
const RestrictionSchema = require("../../models/RestrictionSchema.js");
const premiumUserSchema = require("../../models/PremiumUserSchema.js");
const premiumGuildSchema = require("../../models/PremiumGuildSchema.js");
const maintenanceCheck = require("../custom/maintainance.js"); // Import maintenance check

module.exports = async (client) => {
  client.on("messageCreate", async (message) => {
    if (message.author.bot || !message.guild || !message.id) return;

    const player = client.manager.players.get(message.guild.id);

    const updateData = await SetupSchema.findOne({ guildId: message.guild.id });
    if (updateData && updateData.channelId === message.channel.id) return;

    const isBlacklisted = await BlacklistUserSchema.findOne({ userId: message.author.id });
    if (isBlacklisted) return;

    const isServerBlacklisted = await BlacklistServerSchema.findOne({ serverId: message.guild.id });
    if (isServerBlacklisted) return;

    // =========================
    // Prefix / NoPrefix / Mention
    // =========================
    let prefix;
    const data = await PrefixSchema.findOne({ serverId: message.guild.id });
    prefix = data ? data.prefix : client.config.prefix;

    let npData = await NoPrefixSchema.findOne({ userId: message.author.id });
    const member = message.guild.members.cache.get(message.author.id);
    if (member && member.roles.cache.has("1395685213421703258")) {
      npData = true;
    }

    message.guild.prefix = prefix;

    const mentionRegex = new RegExp(`^<@!?${client.user.id}>`);
    const usedPrefix = message.content.match(mentionRegex)
      ? message.content.match(mentionRegex)[0]
      : prefix;

    if (!npData && !message.content.startsWith(usedPrefix)) return;

    const args = !npData
      ? message.content.slice(usedPrefix.length).trim().split(/ +/)
      : message.content.startsWith(usedPrefix)
      ? message.content.slice(usedPrefix.length).trim().split(/ +/)
      : message.content.trim().split(/ +/);

    const cmd = args.shift()?.toLowerCase();
    const botTag = `<@${client.user.id}>`;

    if (!cmd && message.content === botTag) {
      return message.reply(`My prefix is \`${prefix}\`. Use \`${prefix}help\` to see my commands.`);
    }

    const command =
      client.mcommands.get(cmd) ||
      client.mcommands.find((c) => c.aliases && c.aliases.includes(cmd));
    if (!command) return;

    // =========================
    // Maintenance Check
    // =========================
    if (await maintenanceCheck(client, message, command)) return;

    // =========================
    // IGNORE CHECKS
    // =========================
    const isBypassed = await IgnoreBypassSchema.findOne({
      guildId: message.guild.id,
      userId: message.author.id,
    });

    if (!isBypassed) {
      const ignoredChannel = await IgnoreChannelSchema.findOne({
        guildId: message.guild.id,
        channelId: message.channel.id,
      });

      if (ignoredChannel) {
        const embed = new EmbedBuilder()
          .setColor(client.color || "#FFB800")
          .setTitle("Channel Restricted")
          .setDescription(
            `Commands are disabled in ${message.channel}.\n` +
            `An administrator can enable commands with: \`${prefix}ign channel remove #${message.channel.name}\``
          )
          .setFooter({ text: `Flixo | This message will delete in 10 seconds`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();

        return message.reply({ embeds: [embed] }).then(m => {
          setTimeout(() => {
            m.delete().catch(err => {
              console.error(`[ERROR] Failed to delete ignored channel message:`, err);
            });
          }, 10000);
        });
      }

      const ignoredCommand = await IgnoreCommandSchema.findOne({
        guildId: message.guild.id,
        command: command.name,
      });

      if (ignoredCommand) {
        const embed = new EmbedBuilder()
          .setColor(client.color || "#FFB800")
          .setTitle("Command Restricted")
          .setDescription(
            `The command \`${command.name}\` is disabled in this server.\n` +
            `An administrator can enable it with: \`${prefix}ign command remove ${command.name}\``
          )
          .setFooter({ text: `Flixo | This message will delete in 10 seconds`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();

        return message.reply({ embeds: [embed] }).then(m => {
          setTimeout(() => {
            m.delete().catch(err => {
              console.error(`[ERROR] Failed to delete ignored command message:`, err);
            });
          }, 10000);
        });
      }
    }

    // =========================
    // Voice Channel Checks (inVc, sameVc)
    // =========================
    if (command.inVc && !message.member.voice.channel) {
      const embed = new EmbedBuilder()
        .setColor(client.color || "#FFB800")
        .setTitle("Voice Channel Required")
        .setDescription("You need to be in a voice channel to use this command.")
        .setFooter({ text: `Flixo`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      return message.reply({ embeds: [embed] });
    }

    if (command.sameVc && player) {
      // Fetch the latest member data to avoid cache issues
      const member = await message.guild.members.fetch(message.author.id);
      const botMember = await message.guild.members.fetch(client.user.id);
      const botVoiceChannel = botMember?.voice?.channelId;

      console.log({
        command: command.name,
        userVoiceChannel: member.voice.channelId,
        botVoiceChannel: botVoiceChannel,
        playerVoiceChannel: player.voiceChannel,
      });

      if (member.voice.channelId && botVoiceChannel && member.voice.channelId !== botVoiceChannel) {
        const embed = new EmbedBuilder()
          .setColor(client.color || "#FFB800")
          .setTitle("Same Voice Channel Required")
          .setDescription("You need to be in the same voice channel as the bot to use this command.")
          .setFooter({ text: `Flixo`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();
        return message.reply({ embeds: [embed] });
      }
    }

    // =========================
    // DJ Role Check
    // =========================
    if (command.dj) {
      const djRoleData = await DjRoleSchema.findOne({ guildId: message.guild.id });
      if (djRoleData && !message.member.roles.cache.has(djRoleData.roleId)) {
        const embed = new EmbedBuilder()
          .setColor(client.color || "#FFB800")
          .setTitle("DJ Role Required")
          .setDescription(
            `You need the DJ role to use this command.\n` +
            `An administrator can set the DJ role with: \`${prefix}djrole set @role\``
          )
          .setFooter({ text: `Flixo`, iconURL: message.author.displayAvatarURL() })
          .setTimestamp();

        return message.reply({ embeds: [embed] });
      }
    }

    // =========================
    // Premium Check
    // =========================
    if (command.premium) {
      const premiumData = await premiumGuildSchema.findOne({ Guild: message.guild.id });
      if (!premiumData) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setTitle("Premium Required")
              .setDescription(
                `Hello, ${message.author}!\nThis command is premium only.\nUpgrade here: [Premium Link](https://discord.gg/HaD5sYEj8w)`
              ),
          ],
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setURL("https://discord.gg/HaD5sYEj8w")
                .setLabel("Premium")
            ),
          ],
        });
      }

      if (!premiumData.Permanent && Date.now() > premiumData.Expire) {
        const expiredDuration = Math.floor(
          (Date.now() - premiumData.Expire) / (1000 * 60 * 60 * 24)
        );
        await premiumGuildSchema.deleteOne({ Guild: message.guild.id });
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setDescription(
                `Your Premium Subscription expired ${expiredDuration} days ago! Please renew to continue.`
              ),
          ],
        });
      }
    }

    // =========================
    // Run Command
    // =========================
    try {
      if (command.execute) {
        await command.execute(client, message, args);
      } else if (command.run) {
        await command.run(client, message, args, prefix, player);
      }
    } catch (error) {
      console.error(`[ERROR] Command ${command.name} failed:`, error);
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor(client.config.color)
            .setDescription(`An error occurred while executing the command.`)
        ],
      });
    }
  });
};

function escapeRegex(newprefix) {
  return newprefix.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
}