// twitterAPI.js
// Using dynamic import for node-fetch (if you're using node-fetch v3 in CommonJS)
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Cache user IDs
const userIdCache = new Map();

/**
 * Retrieves the Twitter user ID for a given username.
 * @param {string} username - The Twitter username (without @).
 * @returns {Promise<string>} The user ID.
 */
async function getUserId(username) {
  if (userIdCache.has(username)) {
    return userIdCache.get(username);
  }
  const url = `https://api.twitter.com/2/users/by/username/${username}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
    },
  });

  if (response.status === 429) {
    const retryAfter = response.headers.get("retry-after");
    console.error(
      `Rate limited. Please wait ${retryAfter} seconds before retrying.`
    );
    throw new Error("Rate limited");
  }

  const data = await response.json();

  if (!data.data) throw new Error(`Unable to fetch user data for ${username}`);
  const userId = data.data.id;
  userIdCache.set(username, userId);
  return userId;
}

/**
 * Fetches the most recent tweet for a given Twitter user ID.
 * @param {string} userId - The Twitter user ID.
 * @returns {Promise<object|null>} The latest tweet object, or null if none found.
 */
async function getLatestTweet(userId) {
  // You can adjust max_results (up to 100) if needed.
  const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=5&tweet.fields=created_at,public_metrics`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
    },
  });
  const data = await response.json();
  if (!data.data || data.data.length === 0) return null;
  // Return the first (most recent) tweet
  return data.data[0];
}

module.exports = { getUserId, getLatestTweet };
