const {
  EmbedBuilder,
  WebhookClient,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  PermissionsBitField,
} = require("discord.js");
const client = require("../..");
const web = new WebhookClient({ url: `${client.config.join_log}` });

// Yeh default fake users ka number
client.fakeUsers = client.fakeUsers || 2733476;

module.exports = async (client) => {
  client.on("guildCreate", async (guild) => {
    try {
      // 🔍 Audit Log se Add Karne Wale User Ko Fetch Karo
      let inviter;
      try {
        const auditLogs = await guild.fetchAuditLogs({
          limit: 1,
          type: 28, // BOT_ADD
        });
        const entry = auditLogs.entries.first();
        inviter = entry?.executor || null;
      } catch (e) {
        inviter = null;
      }

      // DM Embed
      let mb = new EmbedBuilder()
        .setTitle(`Hey I am ${client.user.username}`)
        .setColor(client.color)
        .setAuthor({
          name: `Thanks for Inviting Me`,
          iconURL: client.user.displayAvatarURL(),
        })
        .setDescription(
          `Thank you for adding **Flixo** to your server!
Flixo is a high-quality music bot designed to deliver an exceptional listening experience with unique features and smooth performance.
Get started instantly by using the **play** command and enjoy your favorite tracks.
For support, guidance, or updates, visit: [Click here](${client.config.ssLink}`)
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Invite Me")
          .setStyle(ButtonStyle.Link)
          .setURL(`${client.invite}`),
        new ButtonBuilder()
          .setLabel("Support Server")
          .setStyle(ButtonStyle.Link)
          .setURL(`${client.config.ssLink}`),
        new ButtonBuilder()
          .setLabel("DBL")
          .setStyle(ButtonStyle.Link)
          .setURL(`${client.config.dbl}`)
      );

      // ✅ Agar user mila toh DM bhejo
      if (inviter) {
        try {
          await inviter.send({ embeds: [mb], components: [row] });
        } catch {
          console.log(`Could not DM ${inviter.tag}`);
        }
      }

      // 🎟 Server Invite Link Generate Karo
      let inviteLink = "N/A";
      try {
        const invite = await guild.invites.create(guild.channels.cache.filter(ch => 
          ch.permissionsFor(guild.members.me).has(PermissionsBitField.Flags.CreateInstantInvite)
        ).first(), {
          maxAge: 0,
          maxUses: 0,
          reason: "Bot Joined - Logging",
        });
        inviteLink = invite.url;
      } catch (e) {
        console.log("Invite banane mein dikkat aayi:", e.message);
      }

      // --- Webhook Log (server info)
      const realUsers = client.guilds.cache.reduce(
        (acc, g) => acc + (g.memberCount || 0),
        0
      );
      const totalUsers = realUsers + client.fakeUsers;
      const totalGuilds = client.guilds.cache.size;

      let em = new EmbedBuilder()
        .setTitle(`Guild Joined`)
        .setColor(client.color)
        .setAuthor({
          name: `${client.user.username}`,
          iconURL: client.user.displayAvatarURL(),
        })
        .addFields([
          {
            name: `Guild Info`,
            value: `Guild Name: ${guild.name}\nGuild Id: ${
              guild.id
            }\nGuild Created: <t:${Math.round(
              guild.createdTimestamp / 1000
            )}:R>\nGuild Joined: <t:${Math.round(
              guild.joinedTimestamp / 1000
            )}:R>\nGuild Owner: ${
              (await guild.members.fetch(guild.ownerId))
                ? guild.members.cache.get(guild.ownerId).user.tag
                : "Unknown User"
            }\nMemberCount: ${guild.memberCount} Members\nShardId: ${
              guild.shardId
            }\nInvite: ${inviteLink}`,
          },
          {
            name: `Bot Info`,
            value: `**Servers:** ${totalGuilds}\n**Users:** ${totalUsers.toLocaleString()}`,
          },
        ])
        .setThumbnail(guild.iconURL({ dynamic: true }));

      await web.send({ embeds: [em] });
    } catch (err) {
      console.log("Error sending guild join webhook:", err);
    }
  });
};
