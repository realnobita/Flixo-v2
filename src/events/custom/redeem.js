const { EmbedBuilder, WebhookClient } = require("discord.js");
const NoPrefix = require("../../models/NoPrefixSchema");

// webhook client
const webhook = new WebhookClient({
  url: "http://discord.com/api/webhooks/1412686238384783391/aY4_Tr5nIKfM1vHdLhsF2lNhyUZZf9CHyl0xaZOPMvqjEOUZoXICX93tC2axlLKkb5_-"
});

module.exports = async (client) => {
  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === "redeem_noprefix") {
      try {
        const existing = await NoPrefix.findOne({ userId: interaction.user.id });

        // check if still valid
        if (existing && existing.expireAt && existing.expireAt > Date.now()) {
          return interaction.reply({
            content: "❌ You already claimed this reward! Wait until your current access expires.",
            ephemeral: true,
          });
        }

        // set expiry (24h)
        const expiryTime = Date.now() + 24 * 60 * 60 * 1000;

        if (existing) {
          existing.expireAt = expiryTime;
          await existing.save();
        } else {
          await NoPrefix.create({
            userId: interaction.user.id,
            expireAt: expiryTime,
          });
        }

        // reply to user in server (ephemeral)
        await interaction.reply({
          content: "🎉 You successfully claimed **24 hours** of No Prefix access!",
          ephemeral: true,
        });

        // timestamps
        const claimTime = `<t:${Math.floor(Date.now() / 1000)}:F>`;
        const nextClaim = `<t:${Math.floor(expiryTime / 1000)}:F>`;

        // 📌 webhook embed (logs)
        const logEmbed = new EmbedBuilder()
          .setTitle("📢 No Prefix Claimed")
          .setColor(client.color)
          .setThumbnail(interaction.user.displayAvatarURL())
          .addFields(
            { name: "User", value: `${interaction.user.tag} (${interaction.user.id})`, inline: false },
            { name: "Claimed At", value: claimTime, inline: true },
            { name: "Next Claim Available", value: nextClaim, inline: true }
          )
          .setFooter({ text: "No Prefix Reward System", iconURL: client.user.displayAvatarURL() });

        await webhook.send({ embeds: [logEmbed] });

        // 📌 DM embed (professional confirmation)
        const dmEmbed = new EmbedBuilder()
          .setColor(client.color)
          .setAuthor({ name: "🎁 Reward Claimed Successfully" })
          .setDescription(
            `Hello **${interaction.user.username}**, you’ve successfully unlocked **No Prefix Access** for the next **24 hours**!\n\n` +
            `⏰ **Expires At:** ${nextClaim}\n\n` +
            `Enjoy using commands without prefixes and make the most of your premium access! 🚀`
          )
          .setThumbnail(client.user.displayAvatarURL())
          .setFooter({ text: "Floovi Reward System", iconURL: client.user.displayAvatarURL() });

        try {
          await interaction.user.send({ embeds: [dmEmbed] });
          console.log(`✅ DM sent to ${interaction.user.tag}`);
        } catch (err) {
          console.log(`❌ Couldn't DM ${interaction.user.tag}:`, err.message);

          // fallback -> send ephemeral embed in server
          await interaction.followUp({
            embeds: [dmEmbed],
            ephemeral: true,
          }).catch(() => {});
        }

      } catch (err) {
        console.error("Error handling NoPrefix redeem:", err);
        return interaction.reply({
          content: "⚠️ Something went wrong while claiming your reward.",
          ephemeral: true,
        });
      }
    }
  });
};
