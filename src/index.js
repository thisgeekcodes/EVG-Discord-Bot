const fs = require("node:fs");
const path = require("node:path");

require("dotenv").config({ path: __dirname + "/./../.env" });

const {
  Client,
  Collection,
  GatewayIntentBits,
  Events,
  Partials,
} = require("discord.js");
const EventEmitter = require("events");
const registerCommands = require("./commands/register-commands");

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});
// Create Event Emitter
const eventEmitter = new EventEmitter();

// Client Ready
client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});
// Emit an event when an interaction is created
client.on("interactionCreate", async (interaction) => {
  eventEmitter.emit("interaction", interaction); // Forward interaction to event handler
});

// Listen for presence updates and emit them to our eventEmitter
client.on("presenceUpdate", (oldPresence, newPresence) => {
  eventEmitter.emit("presenceUpdate", oldPresence, newPresence);
});

// Register commands when starting the bot
registerCommands()
  .then(() => {
    console.log("Commands registered successfully.");
  })
  .catch(console.error);

client.login(process.env.TOKEN);

// Export both client and eventEmitter
module.exports = { client, eventEmitter };

// Command Handle Events
require("./commands/handle-commands");

// Activity Handler
require("./activity/presence");

// Load the Twitter monitor module (this will start polling)
require("./api/xMonitor");

// Reaction Handler
require("./activity/reaction-handler");

// VC Handler
require("./activity/voicechannel-handler");

// Team Handler
require("./commands/team-commands");

// Logging
require("./activity/server-logs");
