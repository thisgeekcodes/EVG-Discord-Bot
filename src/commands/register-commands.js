const path = require("node:path");
require("dotenv").config({ path: __dirname + "/./../../.env" });
const { REST, Routes } = require("discord.js");

const commands = [
  {
    name: "addrule",
    description: "Add a new rule to the rules message.",
    options: [
      {
        name: "name",
        type: 3, // STRING
        description: "The field name (a short word) for the rule.",
        required: true,
      },
      {
        name: "rule",
        type: 3, // STRING
        description: "The rule text to add.",
        required: true,
      },
    ],
  },
  {
    name: "editrule",
    description: "Edit an existing rule in the rules message.",
    options: [
      {
        name: "name",
        type: 3, // STRING
        description: "The field name of the rule to edit.",
        required: true,
      },
      {
        name: "rule",
        type: 3, // STRING
        description: "The new rule text.",
        required: true,
      },
    ],
  },
  {
    name: "deleterule",
    description: "Delete an existing rule from the rules message.",
    options: [
      {
        name: "name",
        type: 3, // STRING
        description: "The field name of the rule to delete.",
        required: true,
      },
    ],
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
