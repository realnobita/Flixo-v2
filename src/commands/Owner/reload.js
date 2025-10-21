const { readdirSync, statSync } = require("fs");
const { Collection } = require("discord.js");
const path = require("path");

module.exports = {
  name: "reload",
  aliases: ["rd","rl"],
  description: "Reload commands/events (Bot Owner Only)",
  category: "Owner",
  owner: true,
  run: async (client, message, args) => {
    try {
      const type = (args[0] || "").toLowerCase();

      let loadedPrefixCommands = 0;
      let loadedEvents = 0;
      const errors = [];

      // --- COMMANDS RELOAD ---
      const reloadCommands = () => {
        if (!client.mcommands) client.mcommands = new Collection();
        if (!client.aliases) client.aliases = new Collection();
        if (!client.cooldowns) client.cooldowns = new Collection();

        client.mcommands.clear();
        client.aliases.clear();
        client.cooldowns.clear();

        const prefixCommandBasePath = path.join(__dirname, "..");
        let prefixCommandFolders = [];
        try {
          prefixCommandFolders = readdirSync(prefixCommandBasePath).filter((name) =>
            statSync(path.join(prefixCommandBasePath, name)).isDirectory()
          );
        } catch {
          prefixCommandFolders = [];
        }

        for (const folder of prefixCommandFolders) {
          const folderPath = path.join(prefixCommandBasePath, folder);
          const commandFiles = readdirSync(folderPath).filter((f) => f.endsWith(".js"));

          for (const file of commandFiles) {
            try {
              const filePath = path.join(folderPath, file);
              delete require.cache[require.resolve(filePath)];
              const command = require(filePath);

              if (!command?.name || typeof command.name !== "string") continue;
              if (!command.run && !command.execute) continue;

              client.mcommands.set(command.name, command);
              loadedPrefixCommands++;

              if (Array.isArray(command.aliases)) {
                for (const alias of command.aliases) client.aliases.set(alias, command.name);
              }

              if (command.cooldown && !client.cooldowns.has(command.name)) {
                client.cooldowns.set(command.name, new Collection());
              }
            } catch (err) {
              errors.push(`Failed to load ${folder}/${file}: ${err?.stack || err}`);
            }
          }
        }
      };

      // --- EVENTS RELOAD ---
      const reloadEvents = () => {
        let eventsBasePaths = [
          path.join(process.cwd(), "src", "events"),
          path.join(process.cwd(), "events"),
        ];

        let eventFolders = [];
        let foundPath = null;

        for (const basePath of eventsBasePaths) {
          try {
            if (statSync(basePath).isDirectory()) {
              foundPath = basePath;
              eventFolders = readdirSync(basePath).filter((name) =>
                statSync(path.join(basePath, name)).isDirectory()
              );
              break;
            }
          } catch {
            continue;
          }
        }

        if (!foundPath) return; // no events folder found

        for (const folder of eventFolders) {
          const folderPath = path.join(foundPath, folder);
          const eventFiles = readdirSync(folderPath).filter((f) => f.endsWith(".js"));

          for (const file of eventFiles) {
            try {
              const filePath = path.join(folderPath, file);
              delete require.cache[require.resolve(filePath)];
              const event = require(filePath);

              if (!event?.name || typeof event.name !== "string") continue;
              if (typeof event.run !== "function") continue;

              client.removeAllListeners(event.name); // clear old
              client.on(event.name, (...args) => event.run(client, ...args));

              loadedEvents++;
            } catch (err) {
              errors.push(`Failed to load ${folder}/${file}: ${err?.stack || err}`);
            }
          }
        }
      };

      // --- EXECUTION LOGIC ---
      if (!type) {
        return message.reply(
          "**Usage:** `reload <commands|events|all>`\n\n" +
          "`reload commands` → Reload only prefix commands\n" +
          "`reload events`   → Reload only events\n" +
          "`reload all`      → Reload both commands and events"
        );
      }

      if (type === "commands") {
        reloadCommands();
        return message.reply(
          errors.length
            ? `Reloaded ${loadedPrefixCommands} commands with errors:\n\`\`\`js\n${errors.join("\n")}\n\`\`\``
            : `✅ Successfully reloaded ${loadedPrefixCommands} prefix commands!`
        );
      } else if (type === "events") {
        reloadEvents();
        return message.reply(
          errors.length
            ? `Reloaded ${loadedEvents} events with errors:\n\`\`\`js\n${errors.join("\n")}\n\`\`\``
            : `✅ Successfully reloaded ${loadedEvents} events!`
        );
      } else if (type === "all") {
        reloadCommands();
        reloadEvents();
        return message.reply(
          errors.length
            ? `Reloaded ${loadedPrefixCommands} commands and ${loadedEvents} events with errors:\n\`\`\`js\n${errors.join("\n")}\n\`\`\``
            : `✅ Successfully reloaded ${loadedPrefixCommands} commands and ${loadedEvents} events!`
        );
      } else {
        return message.reply("❌ Invalid type! Use `reload <commands|events|all>`.");
      }
    } catch (error) {
      await message.reply(
        "Failed to reload.\n" +
        "```js\n" + (error?.stack || error?.message || String(error)) + "\n```"
      );
    }
  },
};