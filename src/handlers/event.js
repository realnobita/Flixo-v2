const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const boxen = require("boxen");
const moment = require("moment");

module.exports = async (client) => {
  client.on("ready", async () => {
    // Timestamp
    const time = () => chalk.gray(`[${moment().format("HH:mm:ss")}]`);

    // Logger function
    const log = (title, message, color = "cyan") => {
      console.log(
        boxen(chalk[color].bold(`${time()} ${message}`), {
          title: chalk.bgBlack.bold(title),
          titleAlignment: "center",
          padding: 1,
          margin: 1,
          borderStyle: "round",
          borderColor: color,
        })
      );
    };

    // Recursive event loader
    function loadEvents(directory) {
      fs.readdirSync(directory).forEach((file) => {
        const filePath = path.join(directory, file);
        if (fs.lstatSync(filePath).isDirectory()) {
          loadEvents(filePath);
        } else {
          const eventName = file.split(".")[0];
          try {
            require(filePath)(client);
            log("📦 Event Loaded", `✅ ${eventName}`, "green");
          } catch (err) {
            log("❌ Event Error", `⚠️ ${eventName} | ${err.message}`, "red");
          }
        }
      });
    }

    // Start loading
    const eventsDir = path.join(__dirname, "../events");
    loadEvents(eventsDir);

    // Final info log
    log(
      "🚀 Event Handler",
      `All events from '${eventsDir}' have been initialized!`,
      "magenta"
    );
  });
};
