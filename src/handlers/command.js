const { readdirSync } = require("fs");
const { white, green, red, yellow } = require("chalk");

module.exports = async (client) => {
  try {
    client.mcommands.clear();
    let commandCount = 0;

    const categories = readdirSync("./src/commands/");
    let loadedCategories = [];

    for (const dir of categories) {
      const commandFiles = readdirSync(`./src/commands/${dir}`).filter((f) =>
        f.endsWith(".js")
      );

      for (const file of commandFiles) {
        try {
          delete require.cache[require.resolve(`../commands/${dir}/${file}`)];
          const command = require(`../commands/${dir}/${file}`);

          if (!command || !command.name) {
            console.log(red(`[ERROR] ${file} has no "name". Skipped.`));
            continue;
          }

          client.mcommands.set(command.name, command);
          commandCount++;
        } catch (err) {
          console.log(red(`[LOAD FAIL] ${file}:`), err);
        }
      }

      loadedCategories.push(dir);
    }

    console.log(yellow("┌──────────────────────────────┐"));
    console.log(
      yellow("│ ") +
        white(`COMMANDS LOADED (${green(loadedCategories.length)})`).padEnd(28, " ") +
        yellow("│")
    );
    console.log(yellow("├──────────────────────────────┤"));
    for (const dir of loadedCategories) {
      console.log(
        yellow("│ ") + green("[CATEGORY]") + white(` ${dir}`).padEnd(28, " ") + yellow("│")
      );
    }
    console.log(yellow("└──────────────────────────────┘"));

    console.log(
      white("[") +
        green("INFO") +
        white("] Loaded " + green(commandCount) + " commands successfully!")
    );

  } catch (error) {
    console.log(red("[COMMAND HANDLER ERROR]"), error);
  }
};
