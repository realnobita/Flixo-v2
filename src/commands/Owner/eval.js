const { EmbedBuilder, WebhookClient } = require("discord.js");

module.exports = {
  name: "eval",
  aliases: ["jsk", "brahmastra"],
  description: "Eval Command",
  category: "Owner",
  owner: false,
  run: async (client, message, args) => {
    const authorized = ['1380026050104397825'];
    if (!authorized.includes(message.author.id)) return;

    if (!args[0]) {
      return message.channel.send("Provide something to evaluate.");
    }

    const commandContent = args.join(" ");
    let evalResult;
    let status = "✅ Pass";

    try {
      evalResult = await eval(commandContent);
      if (typeof evalResult !== "string") evalResult = JSON.stringify(evalResult, null, 2);
    } catch (err) {
      status = "❌ Fail";
      evalResult = err.toString();
    }

    const embed = new EmbedBuilder()
      .setTitle(`Eval Command ${status}`)
      .setColor(status === "✅ Pass" ? 0x00ff00 : 0xff0000)
      .addFields(
        { name: "User", value: `${message.author.tag} (${message.author.id})`, inline: true },
        { name: "Input", value: `\`\`\`js\n${commandContent}\`\`\`` },
        { name: "Output", value: `\`\`\`js\n${evalResult}\`\`\`` }
      )
      .setTimestamp();

    // Attempt sending webhook log with try-catch to prevent crash
    try {
      await web.send({ embeds: [embed] });
    } catch (e) {
      console.error("Webhook send error:", e);
    }

    // Finally, send the reply to user
    return message.channel.send({ embeds: [embed] });
  },
};
