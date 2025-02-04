// voicechannel-handler.js
const { client } = require("../index");
require("dotenv").config({ path: __dirname + "/./../../.env" });

client.on("voiceStateUpdate", async (oldState, newState) => {
  const lobbyChannelId = process.env.LOBBY_CHANNEL_ID; // Channel to join to trigger new channel creation.
  const voiceCategoryId = process.env.VOICE_CATEGORY_ID || null; // Optional: category for new channels.

  // --- Creating a New Voice Channel ---
  // If a member joins the lobby channel, create a new voice channel.
  if (newState.channelId === lobbyChannelId && newState.member) {
    try {
      // Create a new voice channel with a name like "Username's Channel"
      const newChannel = await newState.guild.channels.create({
        name: `${newState.member.displayName}'s Channel`,
        type: 2, // For Discord.js v13/14, 2 represents a voice channel (or use ChannelType.GuildVoice)
        parent: voiceCategoryId, // Optional: assign to a category if provided
        userLimit: 5, // This sets the maximum number of users allowed in the channel
      });
      // Move the member to the newly created channel.
      await newState.setChannel(newChannel);
      console.log(
        `Created channel ${newChannel.name} and moved ${newState.member.user.tag}`
      );
    } catch (error) {
      console.error("Error creating/moving to new voice channel:", error);
    }
  }

  // --- Deleting an Empty Created Voice Channel ---
  // If a member leaves a channel, check if that channel was one of our created channels.
  // Here, we assume that channels created by our system end with "'s Channel".
  if (
    oldState.channelId &&
    oldState.channel &&
    oldState.channel.name.endsWith("'s Channel")
  ) {
    // If there are no members in that channel, delete it.
    if (oldState.channel.members.size === 0) {
      try {
        console.log(`Deleting empty channel: ${oldState.channel.name}`);
        await oldState.channel.delete("Voice channel empty");
      } catch (error) {
        console.error("Error deleting empty voice channel:", error);
      }
    }
  }
});
console.log("✅ VC handler loaded!");
