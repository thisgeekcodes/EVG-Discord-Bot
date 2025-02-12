// voicechannel-handler.js
const { client } = require("../index");
const { ChannelType } = require("discord.js");
require("dotenv").config({ path: __dirname + "/./../../.env" });

// Use a Set to track temporary channel IDs
const temporaryChannels = new Set();

client.on("voiceStateUpdate", async (oldState, newState) => {
  // Case 1: A user joins a channel (and wasn't in one before)
  if (!oldState.channel && newState.channel) {
    const joinedChannelId = newState.channel.id;
    const normalLobbyId = process.env.LOBBY_CHANNEL_ID;
    const guestLobbyId = process.env.GUEST_LOBBY_CHANNEL_ID;

    // If the user joined one of the designated lobby channels
    if (joinedChannelId === normalLobbyId || joinedChannelId === guestLobbyId) {
      try {
        const parentCategory = newState.channel.parent;
        const channelName = `${newState.member.user.username}'s Channel`;

        // Prepare permission overwrites (for guest lobby)
        let permissionOverwrites = [];
        if (joinedChannelId === guestLobbyId) {
          permissionOverwrites.push({
            id: process.env.GUEST_ROLE_ID,
            allow: ["Connect", "Speak"],
          });
        }

        // Create the temporary voice channel
        const tempChannel = await newState.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildVoice,
          parent: parentCategory,
          permissionOverwrites:
            permissionOverwrites.length > 0 ? permissionOverwrites : undefined,
        });

        temporaryChannels.add(tempChannel.id);

        // Move the member to the new channel
        await newState.member.voice.setChannel(tempChannel.id);
      } catch (error) {
        console.error("Error creating temporary voice channel:", error);
      }
    }
  }

  // Case 2: A user leaves a channel (or switches channels)
  if (
    oldState.channel &&
    (!newState.channel || newState.channel.id !== oldState.channel.id)
  ) {
    // Only process if the channel that was left is tracked as temporary
    if (temporaryChannels.has(oldState.channel.id)) {
      // Re-fetch the channel from the guild's cache to ensure it's valid
      const channel = oldState.guild.channels.cache.get(oldState.channel.id);
      if (channel && channel.members.size === 0) {
        try {
          await channel.delete("Temporary channel deleted because it's empty");
          temporaryChannels.delete(channel.id);
        } catch (error) {
          console.error("Error deleting temporary voice channel:", error);
        }
      }
    }
  }
});

console.log("✅ VC handler loaded!");
