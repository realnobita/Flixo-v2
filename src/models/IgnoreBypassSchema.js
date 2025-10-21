const mongoose = require("mongoose");

const IgnoreBypassSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
});

module.exports = mongoose.model("IgnoreBypass", IgnoreBypassSchema);