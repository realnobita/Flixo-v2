const { Client, Collection, GatewayIntentBits, WebhookClient, EmbedBuilder } = require("discord.js");
const mongoose = require("mongoose");
const { Connectors } = require("shoukaku");
const { Kazagumo, Plugins } = require("kazagumo");
const spotify = require("kazagumo-spotify");
const Deezer = require("kazagumo-deezer");
const Apple = require("kazagumo-apple");
const fs = require("fs");
const path = require("path");
const { ClusterClient, getInfo } = require("discord-hybrid-sharding");
const chalk = require("chalk");

const timestamp = () =>
  chalk.white(`[${new Date().toLocaleTimeString("en-IN", { hour12: true })}]`);

function printBox(title, items, color = "#00f7ff") {
  const width = Math.max(title.length, ...items.map((i) => i.length)) + 6;

  const top = chalk.hex(color)("╔" + "═".repeat(width) + "╗");
  const bottom = chalk.hex(color)("╚" + "═".repeat(width) + "╝");
  const titleLine =
    chalk.hex(color)("║ ") +
    chalk.bold(title.padEnd(width - 2)) +
    chalk.hex(color)(" ║");

  const content = items.map(
    (i) =>
      chalk.hex(color)("║ ") +
      chalk.white(i.padEnd(width - 2)) +
      chalk.hex(color)(" ║")
  );

  console.log("\n" + top);
  console.log(titleLine);
  console.log(chalk.hex(color)("╠" + "═".repeat(width) + "╣"));
  content.forEach((line) => console.log(line));
  console.log(bottom + "\n");
}

class MainClient extends Client {
  constructor() {
    super({
      shards: getInfo().SHARD_LIST,
      shardCount: getInfo().TOTAL_SHARDS,
      allowedMentions: {
        parse: ["roles", "users", "everyone"],
        repliedUser: false,
      },
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildPresences,
      ],
    });

    this.embed = EmbedBuilder;
    this.config = require("../config/config");
    this.emoji = require("../config/emoji");
    this.color = this.config.color;
    this.invite = this.config.invite;
    this.cluster = new ClusterClient(this);
    this.error = new WebhookClient({ url: this.config.error_log });

    this.commands = new Collection();
    this.aliases = new Collection();
    this.mcommands = new Collection();
    this.slashCommands = new Collection();
    this.events = new Collection();

    // 🎵 Kazagumo Manager with multiple sources
    this.manager = new Kazagumo(
      {
        plugins: [
          new spotify({
            clientId: this.config.spotiId,
            clientSecret: this.config.spotiSecret,
          }),
          new Plugins.PlayerMoved(this),
          new Deezer(),
          new Apple({ countryCode: "us" }),
        ],
        defaultSearchEngine: "auto",
        send: (guildId, payload) => {
          const guild = this.guilds.cache.get(guildId);
          if (guild) guild.shard.send(payload);
        },
      },
      new Connectors.DiscordJS(this),
      this.config.nodes
    );

    this.on("error", (error) => {
      this.error.send({ content: `\`\`\`js\n${error.stack}\n\`\`\`` });
    });

    process.on("unhandledRejection", (err) =>
      console.log(`${timestamp()} ${chalk.red("Unhandled Rejection:")}`, err)
    );
    process.on("uncaughtException", (err) =>
      console.log(`${timestamp()} ${chalk.red("Uncaught Exception:")}`, err)
    );

    // 🔥 Load Handlers (added searchManager here)
    ["command", "node", "searchManager"].forEach((x) =>
      require(`../handlers/${x}`)(this)
    );
  }

  async ConnectMongo() {
    console.log(`${timestamp()} Connecting to MongoDB...`);
    mongoose.set("strictQuery", true);

    const mongoURI =
      this.config.Mongo ||
      "mongodb+srv://mongofloovi:Floovi@floovi.tu8lpdq.mongodb.net/your-database-name?retryWrites=true&w=majority&appName=Floovi";

    try {
      await mongoose.connect(mongoURI);
      printBox("MONGODB", ["✅ Connected successfully"], "#4caf50");
      this.db = true;
    } catch (error) {
      printBox("MONGODB ERROR", [error.message], "#ff0000");
    }
  }

  async loadEvents(dir = "../events") {
    const basePath = path.join(__dirname, dir);
    const items = [];

    const readEvents = (folderPath, parent = "") => {
      fs.readdirSync(folderPath).forEach((file) => {
        const fullPath = path.join(folderPath, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          readEvents(fullPath, parent ? `${parent}/${file}` : file);
        } else if (file.endsWith(".js")) {
          const event = require(fullPath);
          if (typeof event === "function") event(this);

          const eventName = path.parse(file).name;
          const displayName = parent ? `${parent}/${eventName}` : eventName;

          items.push(displayName);
        }
      });
    };

    readEvents(basePath);

    printBox(
      `EVENTS LOADED (${items.length})`,
      items.map((e) => `[EVENT] ${e}`),
      "#ff8800"
    );
  }

  async loadSlashCommands(dir = "../slash") {
    const basePath = path.join(__dirname, dir);
    const commands = [];
    const items = [];

    const readCommands = (folderPath, parent = "") => {
      fs.readdirSync(folderPath).forEach((file) => {
        const fullPath = path.join(folderPath, file);
        const stats = fs.statSync(fullPath);

        if (stats.isDirectory()) {
          readCommands(fullPath, parent ? `${parent}/${file}` : file);
        } else if (file.endsWith(".js")) {
          const command = require(fullPath);
          if (command && command.data) {
            commands.push(command.data.toJSON());
            this.slashCommands.set(command.data.name, command);

            const cmdName = parent
              ? `${parent}/${command.data.name}`.toString()
              : command.data.name;

            items.push(cmdName);
          }
        }
      });
    };

    readCommands(basePath);

    this.once("ready", async () => {
      try {
        await this.application.commands.set(commands);

        printBox(
          `SLASH COMMANDS LOADED (${items.length})`,
          items.map((c) => `[SLASH] ${c}`),
          "#00f7ff"
        );
      } catch (err) {
        printBox("SLASH COMMAND SYNC ERROR", [err.message], "#ff0000");
      }
    });
  }

  connect() {
    return super.login(this.config.token);
  }
}

module.exports = MainClient;
