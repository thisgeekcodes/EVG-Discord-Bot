const { Client, GatewayIntentBits } = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const config = require("./config.json");
const { mes } = require("./message.js");

mes.checkMessage();

client.login(config.BOT_TOKEN);
