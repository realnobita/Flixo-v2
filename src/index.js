const MainClient = require("./structure/client");
require("dotenv").config();

const client = new MainClient();
const wait = require("wait");

(async () => {
  await client.ConnectMongo();
  await client.loadEvents();
  await client.loadSlashCommands();
  await client.connect();
})();

module.exports = client;
