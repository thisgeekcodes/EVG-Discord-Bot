// twitterMonitor.js
const { client } = require("../index"); // Ensure you export your Discord client from index.js
const { getUserId, getLatestTweet } = require("./xAPI");
const { EmbedBuilder } = require("discord.js");

const TWITTER_USERNAME = "EtherealVoidGG"; // Twitter username (without @)
const X_ANNOUNCEMENT_CHANNEL_ID = "1326447225554866238"; // Replace with your Discord channel ID

// Store the ID of the last tweet we processed to avoid duplicates.
let lastTweetId = null;

/**
 * Checks for a new tweet from the target user.
 */
async function checkForNewTweet() {
  try {
    // Get the user ID for the target username
    const userId = await getUserId(TWITTER_USERNAME);
    // Get the most recent tweet for the user
    const tweet = await getLatestTweet(userId);
    if (!tweet) return;

    // If the tweet is new, update our lastTweetId and post it in Discord.
    if (tweet.id !== lastTweetId) {
      lastTweetId = tweet.id;

      // Construct a URL to the tweet.
      const tweetUrl = `https://x.com/${TWITTER_USERNAME}/status/${tweet.id}`;

      // Build a Discord embed for the tweet.
      const embed = new EmbedBuilder()
        .setAuthor({ name: TWITTER_USERNAME, url: tweetUrl })
        .setDescription(tweet.text)
        .setTimestamp(new Date(tweet.created_at))
        .setURL(tweetUrl)
        .setColor("#1DA1F2"); // Twitter's signature blue

      // Optionally, add fields with public metrics (like retweets, likes, etc.)
      if (tweet.public_metrics) {
        embed.addFields(
          {
            name: "Retweets",
            value: tweet.public_metrics.retweet_count.toString(),
            inline: true,
          },
          {
            name: "Likes",
            value: tweet.public_metrics.like_count.toString(),
            inline: true,
          }
        );
      }

      // Fetch the Discord channel and send the embed.
      const channel = client.channels.cache.get(X_ANNOUNCEMENT_CHANNEL_ID);
      if (channel) {
        channel.send({ embeds: [embed] });
      } else {
        console.error("Announcement channel not found!.");
      }
    }
  } catch (err) {
    console.error("Error checking for new tweet:", err);
  }
}

// Check for a new tweet every 60 seconds (adjust the interval as needed)
setInterval(checkForNewTweet, 300000);

// Optionally, call once immediately when the monitor starts
checkForNewTweet();
