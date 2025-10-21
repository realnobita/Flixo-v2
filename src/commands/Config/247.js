const {
  PermissionFlagsBits,
  PermissionsBitField,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
} = require("discord.js");
const reconnectAuto = require("../../models/reconnect.js");

module.exports = {
  name: "24/7",
  aliases: ["247", "tfs", "wentyfourseven"],
  description: "Toggle 24/7 mode in your voice channel",
  userPermissions: PermissionFlagsBits.ManageGuild,
  botPermissions: PermissionFlagsBits.Speak,
  cooldowns: 5,
  category: "Config",
  inVc: true,
  sameVc: true,
  vote: false,
  premium: false,

  run: async (client, message, args) => {
    const tick = "<:floovi_tick:1381965556277710860>";
    const cross = "<:floovi_cross:1382029455601569904>";

    const voiceChannel = message.member.voice.channel;
    const botPerms = voiceChannel.permissionsFor(message.guild.members.me);

    if (!botPerms.has(PermissionsBitField.Flags.ViewChannel))
      return message.reply(`${cross} | I need **View Channel** permission in your voice channel.`);

    if (!botPerms.has(PermissionsBitField.Flags.Connect))
      return message.reply(`${cross} | I need **Connect** permission in your voice channel.`);

    if (!botPerms.has(PermissionsBitField.Flags.Speak))
      return message.reply(`${cross} | I need **Speak** permission in your voice channel.`);

    if (!message.member.permissions.has(PermissionsBitField.Flags.ManageGuild))
      return message.reply(`${cross} | You must have **Manage Server** permission to toggle 24/7 mode.`);

    let data = await reconnectAuto.findOne({ GuildId: message.guild.id });

    function getButtons(enabled) {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("enable_247")
          .setLabel("Enable")
          .setStyle(ButtonStyle.Success)
          .setDisabled(enabled),
        new ButtonBuilder()
          .setCustomId("disable_247")
          .setLabel("Disable")
          .setStyle(ButtonStyle.Danger)
          .setDisabled(!enabled)
      );
    }

    const msg = await message.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(client.color)
          .setDescription(`**24/7 mode control for \`${voiceChannel.name}\`**`)
      ],
      components: [getButtons(!!data)],
    });

    const collector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 10000, // 10s only
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== message.author.id) {
        return interaction.reply({ content: `${cross} | Only the person who used the command can interact.`, ephemeral: true });
      }

      if (interaction.customId === "enable_247") {
        data = await reconnectAuto.findOne({ GuildId: message.guild.id });
        if (data) {
          return interaction.update({
            embeds: [
              new EmbedBuilder()
                .setColor(client.color)
                .setDescription(`${cross} | 24/7 mode is already **enabled** in \`${message.guild.channels.cache.get(data.VoiceId)?.name || "Unknown VC"}\`, bound to <#${data.TextId}>.`)
            ],
            components: [] // remove buttons after interaction
          });
        }

        await reconnectAuto.create({
          GuildId: message.guild.id,
          TextId: message.channel.id,
          VoiceId: voiceChannel.id,
        });

        await client.manager.createPlayer({
          guildId: message.guild.id,
          textId: message.channel.id,
          voiceId: voiceChannel.id,
          volume: 100,
          deaf: true,
          shardId: message.guild.shardId,
        });

        return interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setDescription(`${tick} | 24/7 mode has been **enabled** in \`${voiceChannel.name}\`, bound to <#${message.channel.id}>.`)
          ],
          components: [] // remove buttons after interaction
        });
      }

      if (interaction.customId === "disable_247") {
        data = await reconnectAuto.findOne({ GuildId: message.guild.id });
        if (!data) {
          return interaction.update({
            embeds: [
              new EmbedBuilder()
                .setColor(client.color)
                .setDescription(`${cross} | 24/7 mode is already **disabled** here.`)
            ],
            components: [] // remove buttons after interaction
          });
        }

        await reconnectAuto.findOneAndDelete({ GuildId: message.guild.id });

        return interaction.update({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setDescription(`${tick} | 24/7 mode has been **disabled** in \`${voiceChannel.name}\`.`)
          ],
          components: [] // remove buttons after interaction
        });
      }

      collector.stop("done");
    });

    collector.on("end", async (collected, reason) => {
      if (reason !== "done") {
        // agar 10s tak koi interaction na hua
        msg.delete().catch(() => {});
      }
    });
  },
};
    
