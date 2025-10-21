const { VibeSync } = require("vibesync");
const VcStatus = require("../../models/vcstatus");
const { PermissionsBitField, ChannelType } = require("discord.js");

const lastUpdateAt = new Map();
const DEBOUNCE_MS = 1000;
const DEFAULT_STATUS = "♪ Flixo";

function okToUpdate(voiceId, force = false) {
  const now = Date.now();
  const prev = lastUpdateAt.get(voiceId) || 0;
  if (!force && now - prev < DEBOUNCE_MS) return false;
  lastUpdateAt.set(voiceId, now);
  return true;
}

module.exports = (client) => {
  if (!client.vibeSync) client.vibeSync = new VibeSync(client);
  const vibe = client.vibeSync;

  const canBotSetForChannel = (guild, voiceId) => {
    const channel = guild.channels.cache.get(voiceId);
    if (!channel) return false;
    if (
      channel.type !== ChannelType.GuildVoice &&
      channel.type !== ChannelType.GuildStageVoice
    )
      return false;

    const me = guild.members.me;
    if (!me) return false;

    const perms = channel.permissionsFor(me);
    return perms?.has(PermissionsBitField.Flags.ManageChannels) || false;
  };

  const updateVoiceStatus = async (player, statusText, force = false) => {
    try {
      if (!player) return;
      const guildId = player.guildId || player.guild;
      const voiceId = player.voiceId;

      if (!guildId || !voiceId) return;

      const config = await VcStatus.findOne({ guildId });
      if (!config || !config.enabled) return;

      const guild = client.guilds.cache.get(guildId);
      if (!guild) return;

      if (!canBotSetForChannel(guild, voiceId)) {
        await VcStatus.findOneAndUpdate(
          { guildId },
          { enabled: false },
          { upsert: true }
        );
        console.warn(
          `⚠️ Auto-disabled VC status for ${guildId} (missing Manage Channels on ${voiceId}).`
        );
        return;
      }

      if (!okToUpdate(voiceId, force)) return;

      if (statusText && statusText.trim().length) {
        await vibe.setVoiceStatus(voiceId, statusText.trim());
      }
    } catch (err) {
      console.error("VibeSync error while updating voice status:", err);
    }
  };

  const updateFromCurrent = async (player, force = false) => {
    const current = player?.queue?.current;
    if (current) {
      await updateVoiceStatus(player, `♪ ${current.title}`, force);
    }
    // else -> do nothing (skip when no song)
  };

  // ---- player event hooks ----
  client.manager.on("playerStart", async (player, track) => {
    await updateVoiceStatus(player, `♪ ${track?.title ?? "Unknown"}`, true);
  });

  client.manager.on("playerPause", async (player) => {
    const current = player?.queue?.current;
    if (current) {
      await updateVoiceStatus(player, `♪ ${current.title}`, true);
    }
  });

  client.manager.on("playerResume", async (player) => {
    const current = player?.queue?.current;
    if (current) {
      await updateVoiceStatus(player, `♪ ${current.title}`, true);
    }
  });

  client.manager.on("playerEnd", async (player) => {
    setTimeout(() => updateFromCurrent(player, true), 500);
  });

  client.manager.on("trackEnd", async (player) => {
    await updateFromCurrent(player, true);
  });

  client.manager.on("queueEnd", async () => {
    // no action when queue fully empty
  });

  client.manager.on("playerStop", async () => {
    // no action
  });

  client.manager.on("playerDestroy", async () => {
    // no action
  });

  // ---- on bot join VC ----
  client.on("voiceStateUpdate", async (oldState, newState) => {
    if (newState.member?.id !== client.user.id) return;

    // bot joined a VC
    if (!oldState.channelId && newState.channelId) {
      const guildId = newState.guild.id;
      const config = await VcStatus.findOne({ guildId });
      if (!config) return;

      if (config.enabled) {
        await vibe.setVoiceStatus(newState.channelId, "♪ Flixo");
      } else {
        if (canBotSetForChannel(newState.guild, newState.channelId)) {
          await vibe.setVoiceStatus(newState.channelId, "");
        }
      }
    }
  });
};
