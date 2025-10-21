const { EmbedBuilder, WebhookClient } = require("discord.js");

module.exports = async (client) => {
  const TARGET_GUILD_ID = "1371496371147902986";

  const AUTOROLE_IDS = [
    "1380395679817404457",
    "1408361311167057990",
  ];

  // Webhook client
  const webhookClient = new WebhookClient({
    url: "http://discord.com/api/webhooks/1415591891398819860/2v7JOj92EznJ_EyefCqggPCv4ZXV1uaDV8zXd-3gGsjTVdZNUTyLNn4RcYVwWxvxeVw7",
  });

  client.on("guildMemberAdd", async (member) => {
    if (member.guild.id !== TARGET_GUILD_ID) return;

    try {
      // Auto Roles
      for (const roleId of AUTOROLE_IDS) {
        const role = member.guild.roles.cache.get(roleId);
        if (role) {
          await member.roles.add(role).catch(() => {});
        }
      }

      // Welcome Embed
      const welcomeEmbed = new EmbedBuilder()
        .setColor(client.color || 0x5865f2)
        .setAuthor({
          name: `${member.guild.name}`, // Server ka naam
          iconURL: member.guild.iconURL({ dynamic: true }),
        })
        .setDescription(
          `**﹒<#1394691051792498739>﹒ ☆ ﹒ <#1382627200481890354>﹒⪩<#1412712712256884739> ⪨﹒⟡﹒<#1379795939170058240> ﹒ <#1401251350464958534>
-# ⏝︶⊹︶⏝︶ ୨♡୧ ︶⏝︶⊹︶⏝**`
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setFooter({
          text: `Made By Ŋ Ɔ Ɓ I T A`,
          iconURL:
            "https://media.discordapp.net/attachments/1412590250009825391/1415492656611459165/70e1dd3c-659f-48c1-8697-fd342ce327b5.jpg",
        });

      // Webhook ke through send karna
      await webhookClient.send({
        content: `${member}`, // Member mention
        username: "Flixo", // Webhook ka naam
        avatarURL: "https://cdn.discordapp.com/attachments/1412590250009825391/1415492095547805860/flixo.png?ex=68c4b8be&is=68c3673e&hm=e00cd912cd2b50b4664da5feed726407e42317e4ecbd20445631b14e0b4e41b4&",
        embeds: [welcomeEmbed],
      });
    } catch (error) {
      console.error("An error occurred during guildMemberAdd event:", error);
    }
  });
};