const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "sendnoprefix",
  aliases: ["npbutton"],
  category: "owner",
  run: async (client, message) => {
    // only bot owner can run this command
    if (message.author.id !== "1380026050104397825") return; // 🔹 replace YOUR_ID with your Discord ID

    // target channel
    const channel = message.guild.channels.cache.get("1412712208760180766"); // 🔹 replace CHANNEL_ID with your reward channel ID
    if (!channel) return message.reply("❌ Channel not found.");

    // embed
    const embed = new EmbedBuilder()
      .setTitle("🎁 No Prefix Reward")
      .setDescription(
        "Click the button below to claim **24 hours** of No Prefix access.\n> *You can only claim this once per day.*"
      )
      .setColor(client.color || "#2f3136")
      .setFooter({
        text: "Offered by Flixo",
        iconURL: client.user.displayAvatarURL(),
      });

    // button
    const btn = new ButtonBuilder()
      .setCustomId("redeem_noprefix")
      .setLabel("Redeem No Prefix Access")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(btn);

    // send
    await channel.send({ embeds: [embed], components: [row] });
    message.reply("✅ Reward button sent.");
  },
};
