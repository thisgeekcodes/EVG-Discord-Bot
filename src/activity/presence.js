// presence-handler.js
const { client, eventEmitter } = require("../index");
const { getStreamerData, getChannelAvatar } = require("../api/twitchAPI"); // Import Twitch API functions
const { EmbedBuilder } = require("discord.js");

const ANNOUNCEMENT_CHANNEL_ID = "1326451444081233930";
const REQUIRED_ROLE_NAME = "Content Creators";
const LIVE_ROLE_NAME = "Live";

// Delay (in milliseconds) before fetching Twitch data (e.g., 30 seconds)
const TWITCH_DELAY = 30000;

eventEmitter.on("presenceUpdate", async (oldPresence, newPresence) => {
  if (!newPresence || !newPresence.member) return;

  const member = newPresence.member;

  // Only process members with the required role
  if (!member.roles.cache.some((role) => role.name === REQUIRED_ROLE_NAME))
    return;

  const liveRole = member.guild.roles.cache.find(
    (role) => role.name === LIVE_ROLE_NAME
  );
  if (!liveRole) {
    console.error(
      `Live role "${LIVE_ROLE_NAME}" not found in guild ${member.guild.name}`
    );
    return;
  }

  const streamingActivity = newPresence.activities.find(
    (activity) => activity.type === 1 && activity.name === "Twitch"
  );

  const wasStreaming =
    oldPresence?.activities.some(
      (activity) => activity.type === 1 && activity.name === "Twitch"
    ) || false;
  const isNowStreaming = !!streamingActivity;

  // When the user starts streaming
  if (!wasStreaming && isNowStreaming) {
    // Wait for a delay before fetching Twitch data
    setTimeout(async () => {
      const streamUrl = streamingActivity.url; // Expected format: https://www.twitch.tv/username

      // Extract Twitch username from the URL
      const parts = streamUrl.split("/");
      let twitchUsername = parts[parts.length - 1] || parts[parts.length - 2];

      // Fetch Twitch data and channel avatar after the delay
      let streamerData, avatarData;
      try {
        streamerData = await getStreamerData(twitchUsername);
        avatarData = await getChannelAvatar(twitchUsername);
      } catch (err) {
        console.error("Error fetching Twitch data:", err);
      }
      console.log(avatarData);

      // Build the embed announcement using Twitch data
      const embed = new EmbedBuilder()
        .setAuthor({
          name: "LIVE",
          url: streamUrl,
          iconURL: avatarData ? avatarData : null, // Ensure you have an avatar URL
        })
        .setTitle(`${member.displayName} is Live on Twitch!`)
        .setURL(streamUrl)
        .setDescription(
          streamerData ? streamerData.title : "Started streaming!"
        )
        .setColor("#00b0f4")
        .addFields(
          {
            name: "Category",
            value: streamerData ? streamerData.game_name.toString() : "N/A",
            inline: true,
          },
          {
            name: "Viewers",
            value: streamerData ? streamerData.viewer_count.toString() : "N/A",
            inline: true,
          }
        )
        .setTimestamp();

      // Optionally, set an image (e.g., updated thumbnail)
      if (streamerData && streamerData.thumbnail_url) {
        const thumbUrl = streamerData.thumbnail_url
          .replace("{width}", "320")
          .replace("{height}", "180");
        embed.setImage(thumbUrl);
        console.log(thumbUrl);
      }

      // Add the "Live" role
      try {
        await member.roles.add(liveRole.id);
        console.log(`Added "${LIVE_ROLE_NAME}" role to ${member.displayName}`);
      } catch (err) {
        console.error(
          `Failed to add "${LIVE_ROLE_NAME}" role to ${member.displayName}:`,
          err
        );
      }

      // Send the embed announcement
      const channel = client.channels.cache.get(ANNOUNCEMENT_CHANNEL_ID);
      if (channel) {
        console.log(embed);
        channel.send({ embeds: [embed] });
      } else {
        console.error("Announcement channel not found.");
      }
    }, TWITCH_DELAY); // Wait TWITCH_DELAY milliseconds before executing
  }
  // When the user stops streaming
  else if (wasStreaming && !isNowStreaming) {
    if (member.roles.cache.has(liveRole.id)) {
      try {
        await member.roles.remove(liveRole.id);
        console.log(
          `Removed "${LIVE_ROLE_NAME}" role from ${member.displayName}`
        );
      } catch (err) {
        console.error(
          `Failed to remove "${LIVE_ROLE_NAME}" role from ${member.displayName}:`,
          err
        );
      }
    }
  }
});

console.log("✅ Presence handler loaded!");
