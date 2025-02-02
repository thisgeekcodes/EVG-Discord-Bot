const path = require("node:path");
require("dotenv").config({ path: __dirname + "/./../../.env" });

const { eventEmitter } = require("./../index.js"); // Import event emitter

// Listen for interactions
eventEmitter.on("interaction", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "stream") {
    await interaction.reply("Pong!");
  }
});
