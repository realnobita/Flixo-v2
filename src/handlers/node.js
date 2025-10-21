const client = require("../index");

module.exports = async (client) => {

  // Lavalink node is ready
  client.manager.shoukaku.on("ready", function (name) {
    console.log(`[Lavalink] ✅ Node "${name}" is ready!`);
  });

  // Error handling
  client.manager.shoukaku.on("error", function (name, error) {
    console.error(`[Lavalink] ❌ Node "${name}" encountered an error:`, error);
  });

  // Node closed
  client.manager.shoukaku.on("close", function (name, code, reason) {
    console.warn(
      `[Lavalink] ⚠️ Node "${name}" closed | Code: ${code} | Reason: ${reason || "No reason provided"}`
    );
  });

  // Disconnection
  client.manager.shoukaku.on("disconnect", function (name, players, moved) {
    if (moved) return; // Skip if channel move
    players.forEach((player) => player.connection.disconnect());
    console.warn(`[Lavalink] 🔌 Node "${name}" disconnected.`);
  });

};
