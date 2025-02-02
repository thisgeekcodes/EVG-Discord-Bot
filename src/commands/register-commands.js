const path = require("node:path");
require("dotenv").config({ path: __dirname + "/./../../.env" });
const { REST, Routes } = require("discord.js");

const commands = [
  {
    name: "stream",
    description: "Let everyone know you are streaming!",
  },
];

async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
  try {
    console.log("Registering slash commands...");

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );

    console.log("Slash commands were registered successfully!");
  } catch (error) {
    console.log(`There was an error: ${error}`);
  }
}

module.exports = registerCommands;
