const {
  EmbedBuilder,
  PermissionsBitField,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "join",
  aliases: ["j"],
  description: "Join the bot to your voice channel",
  category: "Music",
  cooldown: 5,
  inVc: true,
  sameVc: false,
  premium: false,
  dj: true,

  run: async (client, message, args, prefix, player) => {
    const userChannel = message.member.voice?.channel;
    if (!userChannel) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF5555")
            .setAuthor({
              name: "Join Voice",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("⛔ Not in Voice Channel")
            .setDescription(
              "You must be in a voice channel to use this command.\nJoin a voice channel and try again."
            )
            .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
            .setFooter({
              text: `Requested by ${message.author.username}`,
              iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp(),
        ],
      });
    }

    const me = message.guild.members.me;
    const botChannel = me.voice?.channel;

    const missingPerms = [];
    if (!userChannel.permissionsFor(me).has(PermissionsBitField.Flags.ViewChannel))
      missingPerms.push("View Channel");
    if (!userChannel.permissionsFor(me).has(PermissionsBitField.Flags.Connect))
      missingPerms.push("Connect");
    if (!userChannel.permissionsFor(me).has(PermissionsBitField.Flags.Speak))
      missingPerms.push("Speak");

    if (missingPerms.length > 0) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF5555")
            .setAuthor({
              name: "Join Voice",
              iconURL: client.user.displayAvatarURL(),
            })
            .setTitle("⛔ Missing Permissions")
            .setDescription(
              `I need the following permissions in your voice channel: ${missingPerms.join(", ")}.\n` +
              "Please grant these permissions and try again."
            )
            .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
            .setFooter({
              text: `Requested by ${message.author.username}`,
              iconURL: message.author.displayAvatarURL(),
            })
            .setTimestamp(),
        ],
      });
    }

    if (botChannel) {
      if (botChannel.id === userChannel.id) {
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#1DB954")
              .setAuthor({
                name: "Join Voice",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("✅ Already Connected")
              .setDescription(
                `I'm already in your voice channel: **${botChannel.name}**.\n` +
                `Start playing music with \`${prefix}play <song>\`.`
              )
              .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
              .setFooter({
                text: `Requested by ${message.author.username}`,
                iconURL: message.author.displayAvatarURL(),
              })
              .setTimestamp(),
          ],
        });
      } else {
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("move_bot")
            .setLabel("Move Me Here")
            .setStyle(ButtonStyle.Primary)
            .setEmoji("🔄")
        );

        const replyMsg = await message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("#FFA500")
              .setAuthor({
                name: "Join Voice",
                iconURL: client.user.displayAvatarURL(),
              })
              .setTitle("⚠️ In Another Channel")
              .setDescription(
                `I'm currently in **${botChannel.name}**.\n` +
                "If you have Move Members permission, click the button to move me to your channel."
              )
              .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
              .setFooter({
                text: `Requested by ${message.author.username}`,
                iconURL: message.author.displayAvatarURL(),
              })
              .setTimestamp(),
          ],
          components: [row],
        });

        const collector = replyMsg.createMessageComponentCollector({
          filter: (i) => i.user.id === message.author.id,
          time: 60000,
        });

        collector.on("collect", async (interaction) => {
          if (interaction.customId === "move_bot") {
            if (!message.member.permissions.has(PermissionsBitField.Flags.MoveMembers)) {
              await interaction.update({
                embeds: [
                  new EmbedBuilder()
                    .setColor("#FF5555")
                    .setAuthor({
                      name: "Join Voice",
                      iconURL: client.user.displayAvatarURL(),
                    })
                    .setTitle("⛔ Insufficient Permissions")
                    .setDescription(
                      "You need the Move Members permission to move me.\n" +
                      "Please ask a moderator to grant this or move me manually."
                    )
                    .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
                    .setFooter({
                      text: `Requested by ${message.author.username}`,
                      iconURL: message.author.displayAvatarURL(),
                    })
                    .setTimestamp(),
                ],
                components: [],
              });
              return;
            }

            await me.voice.setChannel(userChannel);

            await interaction.update({
              embeds: [
                new EmbedBuilder()
                  .setColor("#1DB954")
                  .setAuthor({
                    name: "Join Voice",
                    iconURL: client.user.displayAvatarURL(),
                  })
                  .setTitle("✅ Moved Successfully")
                  .setDescription(
                    `I've been moved to your voice channel: **${userChannel.name}**.\n` +
                    `Start playing music with \`${prefix}play <song>\`.`
                  )
                  .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
                  .setFooter({
                    text: `Moved by ${message.author.username}`,
                    iconURL: message.author.displayAvatarURL(),
                  })
                  .setTimestamp(),
              ],
              components: [],
            });
          }
        });

        collector.on("end", () => {
          replyMsg.edit({ components: [] }).catch(() => {});
        });
        return;
      }
    }

    await client.manager.createPlayer({
      guildId: message.guild.id,
      textId: message.channel.id,
      voiceId: userChannel.id,
      volume: 100,
      deaf: true,
      shardId: message.guild.shardId,
    });

    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#1DB954")
          .setAuthor({
            name: "Join Voice",
            iconURL: client.user.displayAvatarURL(),
          })
          .setTitle("✅ Joined Successfully")
          .setDescription(
            `I've joined your voice channel: **${userChannel.name}**.\n` +
            `Start playing music with \`${prefix}play <song>\`.`
          )
          .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
          .setFooter({
            text: `Requested by ${message.author.username}`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setTimestamp(),
      ],
    });
  },
};