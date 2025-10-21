const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const MaintenanceSchema = require("../../models/MaintenanceSchema.js");

module.exports = async (client, message, command) => {
  if (!command) return false;

  const maint = await MaintenanceSchema.findOne({ _id: "global" });
  if (!maint || !maint.isMaintenance) return false;

  if (message.author.id === "1380026050104397825") return false;

  const embed = new EmbedBuilder()
    .setColor("#FF0000")
    .setTitle("Bot Under Maintenance")
    .setDescription(
      "Dear valued users,\n\n" +
      "We are currently performing essential maintenance on the bot to enhance its performance, fix any outstanding issues, and introduce exciting new features. This process is being carefully managed by our dedicated developer team to ensure that Flixo continues to provide you with the best possible experience.\n\n" +
      "During this maintenance period, most commands will be temporarily unavailable to prevent any disruptions or errors. We understand that this may cause some inconvenience, and we sincerely apologize for that. Our goal is to complete this as quickly as possible while maintaining the highest standards of quality.\n\n" +
      "For real-time updates on the maintenance status, any announcements, or to connect with our community and support team, please join our official support server using the button below. There, you can stay informed, ask questions, or report any concerns once the bot is back online.\n\n" +
      "Thank you for your understanding and patience during this time. We appreciate your continued support and look forward to serving you better soon!\n\n" +
      "Best regards,\nThe Flixo Development Team"
    )
    .setFooter({ text: "Flixo | Maintenance Mode Active", iconURL: client.user.displayAvatarURL() })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setURL("https://discord.gg/HaD5sYEj8w")
      .setLabel("Join Support Server")
  );

  await message.reply({ embeds: [embed], components: [row] });

  return true;
};