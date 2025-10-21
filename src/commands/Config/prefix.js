const {
  PermissionFlagsBits,
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType
} = require("discord.js");
const pSchema = require("../../models/PrefixSchema.js");

const DEFAULT_PREFIX = "!";

module.exports = {
  name: "prefix",
  aliases: ["set-prefix", "setprefix"],
  description: "Show or change the bot's prefix",
  userPermissions: PermissionFlagsBits.ManageGuild,
  botPermissions: PermissionFlagsBits.SendMessages,
  cooldowns: 5,
  category: "Config",
  premium: false,

  run: async (client, message, args) => {
    const tick = "<:floovi_tick:1381965556277710860>";
    const cross = "<:floovi_cross:1382029455601569904>";

    // fetch current prefix from DB or default
    let data = await pSchema.findOne({ serverId: message.guild.id });
    let currentPrefix = data?.prefix || DEFAULT_PREFIX;

    // if no args → show help/info
    if (!args[0]) {
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setTitle("Prefix Information")
            .setDescription(
              `**Current Prefix:** \`${currentPrefix}\`\n\n` +
              `**Usage:**\n` +
              `\`${currentPrefix}prefix set <newPrefix>\` → Change the prefix\n` +
              `\`${currentPrefix}prefix reset\` → Reset prefix to default (\`${DEFAULT_PREFIX}\`)\n`
            )
        ],
        allowedMentions: { repliedUser: false }
      });
    }

    // only guild managers can change/reset prefix
    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
      return message.channel.send(`${cross} | You don't have permission to change the prefix.`);
    }

    const subCommand = args[0].toLowerCase();

    // reset prefix
    if (subCommand === "reset") {
      if (data) {
        await data.deleteOne();
      }
      const botMember = await message.guild.members.fetch(client.user.id).catch(() => null);
      if (botMember && botMember.manageable) {
        await botMember.setNickname(`Flixo [${DEFAULT_PREFIX}]`).catch(() => {});
      }
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(`${tick} | Prefix has been reset to default: \`${DEFAULT_PREFIX}\``)
        ]
      });
    }

    // set prefix
    if (subCommand === "set") {
      const newPrefix = args[1];
      if (!newPrefix) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setDescription(`${cross} | Please provide a new prefix.`)
          ],
          allowedMentions: { repliedUser: false }
        });
      }

      if (newPrefix.length > 5) {
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setDescription(`${cross} | Prefix too long. Maximum 5 characters allowed.`)
          ],
          allowedMentions: { repliedUser: false }
        });
      }

      // save/update DB
      if (!data) {
        data = new pSchema({ serverId: message.guild.id, prefix: newPrefix });
        await data.save();
      } else {
        await data.updateOne({ prefix: newPrefix });
      }

      // update bot nickname
      const botMember = await message.guild.members.fetch(client.user.id).catch(() => null);
      if (botMember && botMember.manageable) {
        await botMember.setNickname(`Flixo [${newPrefix}]`).catch(() => {});
      }

      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription(`${tick} | Prefix successfully set to \`${newPrefix}\`.`)
        ]
      });
    }

    // invalid usage
    return message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(client.color)
          .setDescription(`${cross} | Invalid usage. Try \`${currentPrefix}prefix\` to see help.`)
      ]
    });
  }
};