const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },

  // Badges, stats, and user activity
  badges: [{ type: String }],
  listeningTime: { type: Number, default: 0 }, // in milliseconds
  tracksPlayed: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },

  // Favorite tracks
  favorites: [{
    title: String,
    author: String,
    uri: String,
    duration: Number, // in milliseconds
    addedAt: { type: Date, default: Date.now }
  }],

  // User preferences
  preferences: {
    autoplay: { type: Boolean, default: false },
    defaultVolume: { type: Number, default: 50 },
    favoriteGenres: [String]
  },

  // === Spotify Integration ===
  spotify: {
    linked: { type: Boolean, default: false },      // Is Spotify account linked
    profileUrl: { type: String, default: null },    // Spotify user profile URL
    accessToken: { type: String, default: null },   // OAuth token if used
    refreshToken: { type: String, default: null },  // OAuth refresh token
    playlists: [{
      id: String,          // Spotify playlist ID
      name: String,        // Playlist name
      url: String,         // Playlist URL
      tracks: [{
        title: String,
        author: String,
        uri: String,
        duration: Number,
        addedAt: { type: Date, default: Date.now }
      }],
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }]
  },

  // === Music queue/history ===
  queueHistory: [{
    trackTitle: String,
    trackUri: String,
    playedAt: { type: Date, default: Date.now }
  }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("userprofiles", UserProfileSchema);