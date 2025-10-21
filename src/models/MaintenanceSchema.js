const mongoose = require("mongoose");

const MaintenanceSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  isMaintenance: { type: Boolean, default: false },
});

module.exports = mongoose.model("Maintenance", MaintenanceSchema);