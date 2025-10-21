const { 
  EmbedBuilder, 
  ButtonBuilder, 
  ActionRowBuilder, 
  ButtonStyle, 
  WebhookClient 
} = require("discord.js");
const noPrefix = require("../../models/NoPrefixSchema.js");

// 🔹 Webhook Logs 
const LOG_WEBHOOK = new WebhookClient({ url: '' });

// 🔹 Support Server ID
const SUPPORT_SERVER_ID = "";

// 🔹 Permanent Support Server Invite Link
const SUPPORT_INVITE = "";

module.exports = (client) => {
  setInterval(async () => {
    const users = await noPrefix.find({});
    const now = Date.now();

    for (const data of users) {
      if (!data.expireAt) continue; // Agar expire date nahi hai to skip
      const timeLeft = data.expireAt - now;

      // 1h before expiry 
      if (timeLeft <= 36000000 && timeLeft > 0 && !data.notified) {
        data.notified = true; // Notify flag set
        await data.save();

        const user = await client.users.fetch(data.userId).catch(() => null);
        if (user) {
          // DM to that user
          const embed = new EmbedBuilder()
            .setColor("Yellow")
            .setTitle("⚠️ NoPrefix Expiring Soon")
            .setDescription(`Your **NoPrefix** will expire in **${formatDuration(timeLeft)}**.`)
            .setFooter({ text: "Renew to continue using NoPrefix" });

          user.send({ embeds: [embed] }).catch(() => {});
        }

        // Webhook log + ping 
        sendLog("Expiring Soon", data.userId, data.expireAt);
      }

      // ========== Expired ========== g
      if (timeLeft <= 0) {
        await noPrefix.deleteOne({ userId: data.userId }); // DB se hatao
        const user = await client.users.fetch(data.userId).catch(() => null);

        if (user) {
          // DM them
          const embed = new EmbedBuilder()
            .setColor("Red")
            .setTitle("❌ NoPrefix Expired")
            .setDescription("Your **NoPrefix** has expired. Renew it to continue using it.")
            .setFooter({ text: "Join support server to renew" });

          user.send({ embeds: [embed] }).catch(() => {});
        }
        sendLog("Expired", data.userId, data.expireAt);
      }
    }
   }, 3600000); // 1h interval

  // ========== Command expired use interceptor ==========
  client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    const data = await noPrefix.findOne({ userId: message.author.id });
    if (!data) return;

    // if expired 
    if (data.expireAt && Date.now() > data.expireAt) {
      const guild = message.guild;
      const embed = new EmbedBuilder()
        .setColor("Red")
        .setTitle("⏳ NoPrefix Expired")
        .setDescription("Your **NoPrefix** access has expired. Please renew to continue using it.");

      let components = [];
      if (!guild || guild.id !== SUPPORT_SERVER_ID) {
        const btn = new ButtonBuilder()
          .setLabel("Renew NoPrefix")
          .setStyle(ButtonStyle.Link)
          .setURL(SUPPORT_INVITE);
        components = [new ActionRowBuilder().addComponents(btn)];
      }

      message.channel.send({ embeds: [embed], components }).catch(() => {});
    }
  });
  function sendLog(type, userId, expireAt) {
    const embed = new EmbedBuilder()
      .setColor(type === "Expired" ? "Red" : "Yellow")
      .setTitle(`📢 NoPrefix ${type}`)
      .addFields(
        { name: "User", value: `<@${userId}> (${userId})`, inline: false },
        { name: "Expire At", value: expireAt ? `<t:${Math.floor(expireAt / 1000)}:F>` : "Permanent", inline: true },
        { name: "Timestamp", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
      );

    // Webhook + user mention
    LOG_WEBHOOK.send({ content: `<@${userId}>`, embeds: [embed] }).catch(() => {});
  }

  // Time Formatter
  function formatDuration(ms) {
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }
};
