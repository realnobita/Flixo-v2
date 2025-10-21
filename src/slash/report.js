const {
    SlashCommandBuilder,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    ActionRowBuilder,
    EmbedBuilder,
    WebhookClient,
  } = require("discord.js");
  
  // Put your webhook URL in an env or config, not in code.
  // use process.env.REPORT_WEBHOOK or client.config.report_webhook
  const WEBHOOK_URL = ''; // set this in your
  
  function getWebhookClient() {
    if (!WEBHOOK_URL) throw new Error("Missing REPORT_WEBHOOK env var");
    return new WebhookClient({ url: WEBHOOK_URL });
  }
  
  function isValidUrl(s) {
    try { new URL(s); return true; } catch { return false; }
  }
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName("report")
      .setDescription("Submit a report to the bot team"),
  
    /**
     * @param {import('discord.js').ChatInputCommandInteraction} interaction
     */
    async execute(interaction) {
      // Build the modal
      const modal = new ModalBuilder()
        .setCustomId("reportModal")
        .setTitle("📢 Submit a Report");
  
      const reportTitle = new TextInputBuilder()
        .setCustomId("reportTitle")
        .setLabel("Report Title")
        .setPlaceholder("Short name for your report")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
  
      const reportDesc = new TextInputBuilder()
        .setCustomId("reportDesc")
        .setLabel("Report Details")
        .setPlaceholder("Describe the issue in detail")
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);
  
      const reportPriority = new TextInputBuilder()
        .setCustomId("reportPriority")
        .setLabel("Is this important? (Yes/No)")
        .setPlaceholder("Yes or No")
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
  
      const reportImage = new TextInputBuilder()
        .setCustomId("reportImage")
        .setLabel("Image URL (optional)")
        .setPlaceholder("Paste an image link if any")
        .setStyle(TextInputStyle.Short)
        .setRequired(false);
  
      modal.addComponents(
        new ActionRowBuilder().addComponents(reportTitle),
        new ActionRowBuilder().addComponents(reportDesc),
        new ActionRowBuilder().addComponents(reportPriority),
        new ActionRowBuilder().addComponents(reportImage)
      );
  
      await interaction.showModal(modal);
    },
  
    /**
     * Handle modal submissions
     * @param {import('discord.js').Interaction} interaction
     */
    async modalHandler(interaction) {
      if (!interaction.isModalSubmit()) return;
      if (interaction.customId !== "reportModal") return;
  
      try {
        const title = interaction.fields.getTextInputValue("reportTitle").slice(0, 256);
        const desc = interaction.fields.getTextInputValue("reportDesc");
        const priorityRaw = interaction.fields.getTextInputValue("reportPriority");
        const priority = /^(y|yes|true|1)$/i.test(priorityRaw) ? "Yes" :
                         /^(n|no|false|0)$/i.test(priorityRaw) ? "No" : priorityRaw;
        const imageInput = interaction.fields.getTextInputValue("reportImage")?.trim();
        const imageUrl = imageInput && isValidUrl(imageInput) ? imageInput : null;
  
        const time = `<t:${Math.floor(Date.now() / 1000)}:F>`;
  
        // Confirm to the user
        const confirmEmbed = new EmbedBuilder()
          .setColor(0x00ff00)
          .setTitle("✅ Report Submitted")
          .setDescription("Your report has been recorded successfully.")
          .addFields(
            { name: "📝 Report Title", value: title, inline: false },
            { name: "📄 Description", value: desc, inline: false },
            { name: "⚡ Important?", value: priority, inline: true },
            { name: "⏰ Time", value: time, inline: true }
          )
          .setFooter({ text: `Reported by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
          .setTimestamp();
  
        if (imageUrl) confirmEmbed.setImage(imageUrl);
  
        await interaction.reply({ embeds: [confirmEmbed], ephemeral: true });
  
        // Send to webhook
        const reportEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("🚨 New Report")
          .addFields(
            { name: "👤 Reported By", value: `${interaction.user.tag} (${interaction.user.id})`, inline: false },
            { name: "📝 Title", value: title, inline: false },
            { name: "📄 Description", value: desc, inline: false },
            { name: "⚡ Important?", value: priority, inline: true },
            { name: "⏰ Time", value: time, inline: true }
          )
          .setFooter({ text: "New report logged" })
          .setTimestamp();
  
        if (imageUrl) reportEmbed.setImage(imageUrl);
  
        const webhook = getWebhookClient();
        await webhook.send({ embeds: [reportEmbed] }); // await so errors are caught
      } catch (err) {
        console.error("report modal error:", err);
        const msg = "❌ Something went wrong handling your report.";
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
        } else {
          await interaction.followUp({ content: msg, ephemeral: true }).catch(() => {});
        }
      }
    },
  };
  
