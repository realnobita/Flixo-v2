const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const noPrefix = require("../../models/NoPrefixSchema.js");

module.exports = {
  name: "npstatus",
  aliases: ["nps", "checknp", "np status", "noprefixstatus", "noprefixst"],
  description: "Check if a user has NoPrefix status",
  category: "Info",
  owner: false,
  run: async (client, message, args) => {
    let user =
      message.mentions.users.first() ||
      (args[0] && !isNaN(args[0]) && await client.users.fetch(args[0]).catch(() => null)) ||
      message.author;

    if (!user) {
      const embed = new EmbedBuilder()
        .setColor("#FF5555")
        .setAuthor({ name: "NoPrefix Status", iconURL: client.user.displayAvatarURL() })
        .setTitle("⛔ Invalid User")
        .setDescription("Please mention a valid user or provide a valid user ID.")
        .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();
      return message.channel.send({ embeds: [embed] });
    }

    const data = await noPrefix.findOne({ userId: user.id });
    
    // Check if data exists and hasn't expired
    const remaining = data && data.expireAt ? data.expireAt - Date.now() : null;
    if (data && remaining !== null && remaining <= 0) {
      await noPrefix.findOneAndDelete({ userId: user.id });
    }

    // Check if user is in support server
    const supportServerId = "1371496371147902986"; // Replace with your support server ID
    const supportServer = client.guilds.cache.get(supportServerId);
    let isInSupportServer = false;
    
    if (supportServer) {
      try {
        const member = await supportServer.members.fetch(user.id).catch(() => null);
        isInSupportServer = !!member;
      } catch (error) {
        // Silently handle error without console log
      }
    }

    // User doesn't have NoPrefix access
    if (!data || (remaining !== null && remaining <= 0)) {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Join Support Server")
          .setURL("https://discord.gg/HaD5sYEj8w")
          .setStyle(ButtonStyle.Link)
          .setEmoji("🔗")
      );

      const embed = new EmbedBuilder()
        .setColor("#FF5555")
        .setAuthor({ name: "NoPrefix Status", iconURL: client.user.displayAvatarURL() })
        .setTitle("❌ NoPrefix Access Not Found")
        .setDescription(
          `${user.username}, you don't have NoPrefix access.\n` +
          (isInSupportServer
            ? "You're in our support server! Contact a staff member to request NoPrefix access."
            : "Join our support server to request NoPrefix access!")
        )
        .setThumbnail(user.displayAvatarURL({ format: "png", dynamic: true, size: 256 }))
        .setFooter({ text: `Requested by ${message.author.username}`, iconURL: message.author.displayAvatarURL() })
        .setTimestamp();

      return message.channel.send({ embeds: [embed], components: [row] });
    }

    // User has NoPrefix access
    const embed = new EmbedBuilder()
      .setColor("#1DB954") // Spotify green
      .setAuthor({ name: "NoPrefix Status", iconURL: client.user.displayAvatarURL() })
      .setTitle("✅ NoPrefix Access Active")
      .setDescription(`**${user.username}** enjoys premium NoPrefix access!`)
      .setThumbnail(user.displayAvatarURL({ format: "png", dynamic: true, size: 256 }))
      .addFields(
        {
          name: "Access Level",
          value: data.permanent ? "Permanent VIP" : "Temporary Access",
          inline: true
        },
        {
          name: "Expiration",
          value: remaining ? formatDuration(remaining) : "Lifetime",
          inline: true
        },
        {
          name: "Benefits",
          value: "• Use commands without a prefix\n• Faster command execution\n• Exclusive feature access\n• Priority support",
          inline: false
        }
      )
      .setFooter({ 
        text: `Requested by ${message.author.username} | Premium Access`, 
        iconURL: message.author.displayAvatarURL() 
      })
      .setTimestamp();

    return message.channel.send({ embeds: [embed] });
  },
};

function formatDuration(ms) {
  if (ms <= 0) return "Expired";
  
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const months = Math.floor(days / 30);
  
  if (months > 0) {
    const remainingDays = days % 30;
    return `${months} month${months > 1 ? "s" : ""}${remainingDays > 0 ? `, ${remainingDays} day${remainingDays > 1 ? "s" : ""}` : ""}`;
  }
  
  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days} day${days > 1 ? "s" : ""}${remainingHours > 0 ? `, ${remainingHours} hour${remainingHours > 1 ? "s" : ""}` : ""}`;
  }
  
  if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours > 1 ? "s" : ""}${remainingMinutes > 0 ? `, ${remainingMinutes} minute${remainingMinutes > 1 ? "s" : ""}` : ""}`;
  }
  
  if (minutes > 0) {
    const remainingSeconds = seconds % 60;
    return `${minutes} minute${minutes > 1 ? "s" : ""}${remainingSeconds > 0 ? `, ${remainingSeconds} second${remainingSeconds > 1 ? "s" : ""}` : ""}`;
  }
  
  return `${seconds} second${seconds > 1 ? "s" : ""}`;
}