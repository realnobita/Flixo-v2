const { EmbedBuilder, WebhookClient } = require("discord.js");
const NoPrefixSchema = require("../../models/NoPrefixSchema.js");

const HEADQUARTER_ROLE = ""; // Add Your Main Role ( which u want read for booster person)
const webhook = new WebhookClient({
  url: process.env.BOOST_WEBHOOK_URL || "",
});

module.exports = async (client) => {
  client.on("guildMemberUpdate", async (oldMember, newMember) => {
    const hadRole = oldMember.roles.cache.has(HEADQUARTER_ROLE);
    const hasRole = newMember.roles.cache.has(HEADQUARTER_ROLE);

    // Role Added
    if (!hadRole && hasRole) {
      let exists = await NoPrefixSchema.findOne({ userId: newMember.id });
      if (!exists) {
        await NoPrefixSchema.create({ userId: newMember.id });
      }

      try {
        await webhook.send({
          content: `${newMember}`,
          embeds: [
            new EmbedBuilder()
              .setColor(client.color ?? 0x5865f2)
              .setTitle("Thankyou for boosting")
              .setDescription(
                `Hey **${newMember.user.tag}**, thank you for boosting our server.\nWe have now given you the noprefix role. If you remove the boost, noprefix will automatically be removed from my database, so please don't remove your boost.`
              )
              .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
              .setTimestamp(),
          ],
        });
      } catch (err) {
        console.error("Webhook send failed (role added):", err);
      }
    }

    // Role Removed
    if (hadRole && !hasRole) {
      await NoPrefixSchema.deleteOne({ userId: newMember.id });

      try {
        await webhook.send({
          content: `${newMember}`,
          embeds: [
            new EmbedBuilder()
              .setColor(client.color ?? 0x5865f2)
              .setTitle("Boost Removed")
              .setDescription(
                `Oh no, **${newMember.user.tag}**, your **NoPrefix Mode** has been revoked.\nYou'll need to use the prefix again to command Flixo — but the music never stops!`
              )
              .setThumbnail(newMember.user.displayAvatarURL({ dynamic: true }))
              .setTimestamp(),
          ],
        });
      } catch (err) {
        console.error("Webhook send failed (role removed):", err);
      }
    }
  });
};
