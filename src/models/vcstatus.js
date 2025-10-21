const { Schema, model } = require("mongoose");

const vcStatusSchema = new Schema({
  guildId: { type: String, required: true, unique: true, index: true },
  enabled: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
});

vcStatusSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = model("VcStatus", vcStatusSchema, "vc_status");
