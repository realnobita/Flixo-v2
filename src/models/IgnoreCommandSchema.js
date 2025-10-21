const mongoose = require("mongoose");
const IgnoreCommandSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  command: { type: String, required: true },
});
module.exports = mongoose.model("IgnoreCommand", IgnoreCommandSchema);