const path = require("node:path");
require("dotenv").config({ path: __dirname + "/./../../.env" });
const { REST, Routes } = require("discord.js");
const { SlashCommandBuilder } = require("@discordjs/builders");

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
  new SlashCommandBuilder()
    .setName("create-team")
    .setDescription("Creates a new team")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("The name of the team")
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName("lead")
        .setDescription("The user who will be the team lead")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("A short description of the team")
        .setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName("add-to-team")
    .setDescription("Adds a member to a team")
    .addStringOption((option) =>
      option
        .setName("name")
        .setDescription("The unique name of the team")
        .setRequired(true)
    )
    .addUserOption((option) =>
      option
        .setName("member")
        .setDescription("The user to add to the team")
        .setRequired(true)
    ),
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
