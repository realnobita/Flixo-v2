const { Client, Message } = require("discord.js");
const schema = require("../../models/PremiumGuildSchema");

// Authorized user IDs
const authorizedUsers = ["1380026050104397825","1322838042897289267"];

module.exports = {
    name: "remprem",
    aliases: ["deletepremium", "premiumremove", "--", "removeprem", "removepremium"],
    description: "Delete Premium",
    category: "Owner",
    owner: true,

    run: async (client, message, args, prefix) => {
        // Only allow authorized users
        if (!authorizedUsers.includes(message.author.id)) return;

        // Check guild ID argument
        if (!args[0]) return message.reply("<:floovi_warn:1382779289858211880> Please specify a guild ID!");

        try {
            // Check if premium data exists
            const data = await schema.findOne({ Guild: args[0] });
            if (!data) return message.reply("<:floovi_warn:1382779289858211880> The ID you provided is not present in the database.");

            // Delete premium entry
            await schema.deleteOne({ Guild: args[0] });

            // Attempt to reset nickname
            const guild = await client.guilds.fetch(args[0]).catch(() => null);
            if (guild) {
                const me = guild.members.me;
                if (me && me.manageable) {
                    await me.setNickname(null).catch(() => {});
                }
            }

            return message.reply("<:floovi_tick:1381965556277710860> Successfully removed premium and reset the bot nickname.");
        } catch (err) {
            console.error(err);
            return message.reply("An error occurred while processing your request.");
        }
    },
};