const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const fs = require('fs');
const path = require('path');

module.exports = {
  name: "help",
  aliases: ["h"],
  description: "Displays all available commands",
  category: "Info",
  cooldown: 5,
  run: async (client, message, args, prefix) => {
    // Get all command categories dynamically
    const categories = {};
    const commandsPath = path.join(__dirname, '..');
    const categoryFolders = fs.readdirSync(commandsPath);

    for (const folder of categoryFolders) {
      if (!fs.statSync(path.join(commandsPath, folder)).isDirectory()) continue;

      const commandFiles = fs.readdirSync(path.join(commandsPath, folder))
        .filter(file => file.endsWith('.js'));

      categories[folder] = commandFiles.map(file => {
        const command = require(path.join(commandsPath, folder, file));
        return `\`${command.name}\``;
      });
    }

    // Format category names
    const formattedCategories = {
      'Music': categories['Music'] || [],
      'Filters': categories['Filters'] || [],
      'Playlist': categories['Playlist'] || [],
      'Favourite': categories['Favourite'] || [],
      'Purge': categories['Purge'] || [],
      'Config': categories['Config'] || [],
      'Info': categories['Info'] || [],
    };

    // Main help embed with minimal UI
    const mainEmbed = new EmbedBuilder()
      .setColor("#1DB954") // Spotify green
      .setAuthor({
        name: `${client.user.username} Commands`,
        iconURL: client.user.displayAvatarURL(),
      })
      .setThumbnail(client.user.displayAvatarURL({ size: 256 }));

    // Add fields for each category without emojis or descriptions
    for (const [category, commands] of Object.entries(formattedCategories)) {
      if (commands.length > 0) {
        mainEmbed.addFields({
          name: `${category} [${commands.length}]`,
          value: commands.join(', '),
          inline: false
        });
      }
    }

    mainEmbed.setFooter({ 
      text: `Requested by ${message.author.username}`,
      iconURL: message.author.displayAvatarURL() 
    })
    .setTimestamp();

    // Create buttons
    const supportButton = new ButtonBuilder()
      .setLabel('Support')
      .setURL('https://discord.gg/HaD5sYEj8w')
      .setStyle(ButtonStyle.Link);

    const premiumButton = new ButtonBuilder()
      .setLabel('Premium')
      .setURL('https://discord.gg/HaD5sYEj8w')
      .setStyle(ButtonStyle.Link);

    const inviteButton = new ButtonBuilder()
      .setLabel('Invite Me')
      .setURL(`https://discord.com/oauth2/authorize?client_id=1380994881731952741&permissions=100003281&scope=bot&response_type=code&redirect_uri=https://discord.gg/HaD5sYEj8w`)
      .setStyle(ButtonStyle.Link);
      
    const buttonRow = new ActionRowBuilder().addComponents(
      inviteButton, supportButton, premiumButton
    );

    // Send the message
    await message.channel.send({
      embeds: [mainEmbed],
      components: [buttonRow]
    });
  },
};