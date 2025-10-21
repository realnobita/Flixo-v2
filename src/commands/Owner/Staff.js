const { EmbedBuilder } = require("discord.js");
const permNoPrefix = require("../../models/permNoPrefixSchema.js");

const ownerIDS = [
  "1380026050104397825"
];

module.exports = {
  name: "team",
  aliases: ["staff"],
  description: "Permanently add or remove users from the NoPrefix list",
  category: "Owner",
  owner: false,

  run: async (client, message, args, prefix) => {
    // Check for authorized owners
    if (!ownerIDS.includes(message.author.id)) return;

    try {
      let userId;
      if (message.mentions.users.size) {
        userId = message.mentions.users.first().id;
      } else if (args[1] && !isNaN(args[1])) {
        userId = args[1];
      }

      if (!args[0]) {
        const embed = new EmbedBuilder()
          .setColor(client.color)
          .setTitle("Noprefix Excess Command Usage")
          .setDescription(
            `**Add User:** \`${prefix}staff /team add <user>\`\n` +
            `**Remove User:** \`${prefix}staff/team remove <user>\`\n` +
            `**List Users:** \`${prefix}staff/team list\``
          );
        return message.channel.send({ embeds: [embed] });
      }

      if (args[0].toLowerCase() === "add") {
        if (!userId) {
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(client.color)
                .setDescription("Please provide a valid user mention or ID to add.\n\n**Usage:** `staff add <user>`")
            ]
          });
        }

        const existingData = await permNoPrefix.findOne({ userId });
        if (existingData) {
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor("#FF0000")
                .setDescription("This user already in our Team")
            ]
          });
        }

        await permNoPrefix.create({ 
          userId, 
          addedBy: message.author.id 
        });

        // Get user details for embed
        const targetUser = await client.users.fetch(userId);
        const executor = message.author;

        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setDescription(`Added <@${userId}> to our Team List.`)
              .setFooter({ 
                text: `Added by ${executor.globalName || executor.username}`, 
                iconURL: executor.displayAvatarURL() 
              })
              .setThumbnail(targetUser.displayAvatarURL())
          ]
        });
      }

      if (args[0].toLowerCase() === "remove") {
        if (!userId) {
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(client.color)
                .setDescription("Please provide a valid user mention or ID to remove.\n\n**Usage:** `staff remove <user>`")
            ]
          });
        }

        const data = await permNoPrefix.findOne({ userId });
        if (!data) {
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(client.color)
                .setDescription("This user doesn't In our Team.")
            ]
          });
        }

        await permNoPrefix.findOneAndDelete({ userId });
        
        // Get user details for embed
        const targetUser = await client.users.fetch(userId);
        const executor = message.author;
        
        return message.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(client.color)
              .setDescription(`Removed <@${userId}> from Our Team and he lost his noprefix add or remove access.`)
              .setFooter({ 
                text: `Removed by ${executor.globalName || executor.username}`, 
              })
              .setThumbnail(targetUser.displayAvatarURL())
          ]
        });
      }

      if (args[0].toLowerCase() === "list") {
        const data = await permNoPrefix.find();
        if (!data.length) {
          return message.channel.send({
            embeds: [
              new EmbedBuilder()
                .setColor(client.color)
                .setDescription("No users found in the permanent NoPrefix list.")
            ]
          });
        }

        let users = [];
        for (let i = 0; i < data.length; i++) {
          try {
            const user = await client.users.fetch(data[i].userId);
            const addedBy = await client.users.fetch(data[i].addedBy);
            
            users.push(`**${i + 1}.** ${user.username} (${user.id}) - Added by: ${addedBy.username}`);
          } catch (e) {
            users.push(`**${i + 1}.** Unknown User (${data[i].userId})`);
          }
        }

        const embed = new EmbedBuilder()
          .setColor(client.color)
          .setTitle("Permanent No Prefix Users List")
          .setDescription(users.join("\n"))
          .setFooter({ 
            text: `Requested by ${message.author.globalName || message.author.username}`, 
            iconURL: message.author.displayAvatarURL() 
          });

        return message.channel.send({ embeds: [embed] });
      }

      // If none of the valid subcommands were used
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription("Invalid subcommand. Use `add`, `remove`, or `list`.\n\n**Example:** `staff/team add @user`")
        ]
      });

    } catch (error) {
      console.log(error);
      return message.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor(client.color)
            .setDescription("An error occurred while executing this command.")
        ]
      });
    }
  }
};