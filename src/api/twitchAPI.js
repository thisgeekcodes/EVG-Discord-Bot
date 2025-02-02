const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

let twitchAccessToken = null;
let tokenExpiry = 0;

// Fetches (or reuses) a Twitch access token
async function getTwitchAccessToken() {
  // Reuse token if it exists and is not expired
  if (twitchAccessToken && tokenExpiry > Date.now()) {
    return twitchAccessToken;
  }

  const params = new URLSearchParams({
    client_id: process.env.TWITCH_CLIENT_ID,
    client_secret: process.env.TWITCH_CLIENT_SECRET,
    grant_type: "client_credentials",
  });

  const response = await fetch(
    `https://id.twitch.tv/oauth2/token?${params.toString()}`,
    {
      method: "POST",
    }
  );

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("Could not obtain Twitch access token");
  }

  twitchAccessToken = data.access_token;
  // data.expires_in is in seconds; convert to milliseconds
  tokenExpiry = Date.now() + data.expires_in * 1000;

  return twitchAccessToken;
}

// Fetches channel/stream data for the given Twitch username
async function getStreamerData(twitchUsername) {
  const token = await getTwitchAccessToken();
  const url = `https://api.twitch.tv/helix/streams?user_login=${twitchUsername}`;

  const response = await fetch(url, {
    headers: {
      "Client-ID": process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  // If the stream is live, data.data should contain at least one stream object
  return data.data && data.data.length ? data.data[0] : null;
}

// New function: Fetch the channel's avatar (profile image) for a given Twitch username.
async function getChannelAvatar(twitchUsername) {
  const token = await getTwitchAccessToken();
  const url = `https://api.twitch.tv/helix/users?login=${twitchUsername}`;

  const response = await fetch(url, {
    headers: {
      "Client-ID": process.env.TWITCH_CLIENT_ID,
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  // The Twitch API returns an array of users; we take the first one.
  return data.data && data.data.length ? data.data[0].profile_image_url : null;
}

module.exports = {
  getStreamerData,
  getChannelAvatar,
};
