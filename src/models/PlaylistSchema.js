const mongoose = require("mongoose");

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  url: { type: String, required: true },
  duration: { type: Number, required: true }, // in ms
  thumbnail: { type: String },
  author: { type: String },
  addedAt: { type: Date, default: Date.now },
});

const playlistSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // Discord user ID
  name: { type: String, required: true },   // Playlist name
  songs: [songSchema],                      // Array of songs
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Update `updatedAt` before save
playlistSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model("Playlist", playlistSchema);
