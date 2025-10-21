const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const os = require("os");

module.exports = {
  name: "stats",
  aliases: ["botinfo", "st", "bi"],
  description: "Show bot and shard stats",
  category: "Info",
  run: async (client, message, args) => {
    try {
      // ✅ Async uptime formatter (no moment needed)
      const formatDuration = async (ms) => {
        let sec = Math.floor(ms / 1000);
        let min = Math.floor(sec / 60);
        let hrs = Math.floor(min / 60);
        let days = Math.floor(hrs / 24);

        sec %= 60;
        min %= 60;
        hrs %= 24;

        return `${days}d ${hrs}h ${min}m ${sec}s`;
      };

      const uptime = await formatDuration(client.uptime);

      // Memory & CPU
      const memoryUsage = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      const cpuLoad = os.loadavg()[0].toFixed(2);

      // Embed
      const embed = new EmbedBuilder()
        .setTitle("📊 Bot & Shard Stats")
        .setColor(0x2f3136)
        .addFields(
          {
            name: "Bot Info",
            value:
              `**Servers:** ${client.guilds.cache.size.toLocaleString()}\n` +
              `**Users:** ${client.users.cache.size.toLocaleString()}\n` +
              `**Uptime:** ${uptime}\n` +
              `**Memory:** ${memoryUsage} MB\n` +
              `**CPU Load:** ${cpuLoad}%`,
            inline: false,
          },
          {
            name: "Dev ‹/›",
            value: `[ᴍʀ ɴᴏʙɪᴛᴀ](https://discord.com/users/1380026050104397825)`,
            inline: false,
          },
          {
            name: "Shard Info",
            value:
              `**Shard ID:** ${message.guild.shardId}\n` +
              `**Total Shards:** ${client.ws.shards.size}`,
            inline: false,
          }
        )
        .setFooter({
          text: `Requested by ${message.author.tag}`,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      // Buttons
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("Get Me")
          .setStyle(ButtonStyle.Link)
          .setURL(
            "https://discord.com/oauth2/authorize?client_id=1380994881731952741&permissions=100003281&scope=bot&response_type=code&redirect_uri=https://discord.gg/HaD5sYEj8w"
          ),
        new ButtonBuilder()
          .setLabel("Website")
          .setStyle(ButtonStyle.Link)
          .setURL("https://flixoo.vercel.app"),
        new ButtonBuilder()
          .setLabel("Need Help?")
          .setStyle(ButtonStyle.Link)
          .setURL("https://discord.gg/HaD5sYEj8w")
      );

      // Send embed
      await message.channel.send({ embeds: [embed], components: [row] });
    } catch (err) {
      console.error(err);
      message.reply("⚠️ An error occurred while fetching bot stats.");
    }
  },
};
