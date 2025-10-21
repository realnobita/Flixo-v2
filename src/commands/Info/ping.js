const { EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");

module.exports = {
  name: "ping",
  aliases: [],
  description: "Check bot and database latency",
  category: "Info",
  run: async (client, message, args) => {
    try {
      const msg = await message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("#FFA500") // Orange for pending
            .setAuthor({ name: "Ping Check", iconURL: client.user.displayAvatarURL() })
            .setTitle("🏓 Pinging...")
            .setDescription("Measuring bot, API, and database latency. Please wait...")
            .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
            .setTimestamp()
        ]
      });

      // Calculate Bot Latency
      const botLatency = msg.createdTimestamp - message.createdTimestamp;
      const apiLatency = Math.round(client.ws.ping);

      // Calculate DB Latency
      const dbStart = Date.now();
      await mongoose.connection.db.admin().ping();
      const dbLatency = Date.now() - dbStart;

      const embed = new EmbedBuilder()
        .setColor("#1DB954") // Spotify green
        .setAuthor({ name: "Ping Results", iconURL: client.user.displayAvatarURL() })
        .setTitle("🏓 Pong!")
        .setDescription("Here are the latency results for the bot and database:")
        .setThumbnail(client.user.displayAvatarURL({ size: 256 }))
        .addFields(
          { name: "Bot Latency", value: `\`${botLatency}ms\``, inline: true },
          { name: "API Latency", value: `\`${apiLatency}ms\``, inline: true },
          { name: "Database Latency", value: `\`${dbLatency}ms\``, inline: true }
        )
        .setFooter({ 
          text: `Requested by ${message.author.username}`, 
          iconURL: message.author.displayAvatarURL() 
        })
        .setTimestamp();

      await msg.edit({ embeds: [embed] });
    } catch (err) {
      const errorEmbed = new EmbedBuilder()
        .setColor("#FF5555")
        .setAuthor({ name: "Ping Check", iconURL: client.user.displayAvatarURL() })
        .setTitle("⛔ Error")
        .setDescription("An error occurred while checking the ping. Please try again.")
        .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      await message.channel.send({ embeds: [errorEmbed] });
    }
  }
};