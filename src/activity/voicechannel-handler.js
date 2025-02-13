// voicechannel-handler.js
const { client } = require("../index");
const { ChannelType } = require("discord.js");
const mysql = require("mysql2/promise");
require("dotenv").config({ path: __dirname + "/./../../.env" });

// MySQL Connection Setup
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

// Use a Set to track temporary channel IDs
const temporaryChannels = new Set();

client.on("voiceStateUpdate", async (oldState, newState) => {
  // Case 1: A user joins a channel (and wasn't in one before)
  if (!oldState.channel && newState.channel) {
    const joinedChannelId = newState.channel.id;
    const normalLobbyId = process.env.LOBBY_CHANNEL_ID;
    const guestLobbyId = process.env.GUEST_LOBBY_CHANNEL_ID;
    const teamLobbyId = process.env.TEAM_LOBBY_CHANNEL_ID;
    const defaultChannelId = process.env.DEFAULT_VOICE_CHANNEL_ID; // Define a default channel to move unauthorized users

    // If the user joined one of the designated lobby channels
    if (joinedChannelId === normalLobbyId || joinedChannelId === guestLobbyId) {
      try {
        const parentCategory = newState.channel.parent;
        // Determine channel name based on the joined lobby
        let channelName = `${newState.member.user.username}'s Channel`;
        if (joinedChannelId === guestLobbyId) {
          channelName = `Guest ${newState.member.user.username}'s`;
        }

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
    } else if (joinedChannelId === teamLobbyId) {
      // Case 3: Check if the user belongs to a team and is in the correct team lobby
      try {
        const [rows] = await db.execute(
          "SELECT teams.name FROM team_members INNER JOIN teams ON team_members.teamId = teams.id WHERE team_members.memberId = ?",
          [newState.member.id]
        );

        if (rows.length === 0) {
          await newState.member.send(
            "You do not belong to a team and cannot join the team lobby."
          );
          if (defaultChannelId) {
            await newState.member.voice.setChannel(defaultChannelId); // Move to default channel
          } else {
            await newState.member.voice.disconnect(); // Disconnect from voice
          }
          return;
        }

        const teamName = rows[0].name;
        const teamRole = newState.guild.roles.cache.find(
          (role) => role.name === teamName
        );

        if (!teamRole) {
          return newState.member.send(
            "Your team does not have a corresponding role, so a voice channel cannot be created."
          );
        }

        const parentCategory = newState.channel.parent;
        const channelName = `Team ${teamName}`;

        // Create the temporary voice channel
        const tempChannel = await newState.guild.channels.create({
          name: channelName,
          type: ChannelType.GuildVoice,
          parent: parentCategory,
          permissionOverwrites: [
            {
              id: teamRole.id,
              allow: ["ViewChannel", "Connect", "Speak"],
            },
            {
              id: newState.guild.id, // Deny everyone else
              deny: ["ViewChannel", "Connect", "Speak"],
            },
          ],
        });

        temporaryChannels.add(tempChannel.id);

        // Move the member to the new channel
        await newState.member.voice.setChannel(tempChannel.id);
      } catch (error) {
        console.error(
          "Error checking team membership or creating voice channel:",
          error
        );
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
