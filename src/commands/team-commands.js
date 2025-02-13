const path = require("node:path");
require("dotenv").config({ path: __dirname + "/./../../.env" });

const { eventEmitter } = require("./../index");
const { PermissionsBitField } = require("discord.js");
const mysql = require("mysql2/promise");

// MySQL Connection Setup
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  supportBigNumbers: true, // ✅ Ensures BIGINT values are handled correctly
  bigNumberStrings: true, // ✅ Forces MySQL to return BIGINT as strings
});

// Listen for interactions
eventEmitter.on("interaction", async (interaction) => {
  if (!interaction.isCommand()) return;

  // Create Team Command
  if (interaction.commandName === "create-team") {
    if (
      !interaction.member.roles.cache.some((role) => role.name === "Management")
    ) {
      return interaction.reply({
        content: "You do not have permission to create a team.",
        ephemeral: true,
      });
    }

    const teamName = interaction.options.getString("name");
    const teamLead = interaction.options.getUser("lead");
    const teamDescription = interaction.options.getString("description");
    const teamLeadId = teamLead.id;

    try {
      // Check if the team name already exists in the database
      const [existingTeams] = await db.execute(
        "SELECT id FROM teams WHERE LOWER(name) = LOWER(?)",
        [teamName]
      );
      if (existingTeams.length > 0) {
        return interaction.reply({
          content: "A team with this name already exists in the database.",
          ephemeral: true,
        });
      }

      // Check if the team name already exists as a Discord role
      const existingRole = interaction.guild.roles.cache.find(
        (role) => role.name.toLowerCase() === teamName.toLowerCase()
      );
      if (existingRole) {
        return interaction.reply({
          content: "A role with this name already exists in the server.",
          ephemeral: true,
        });
      }

      // Insert the new team into the database
      const [result] = await db.execute(
        "INSERT INTO teams (name, leadId, description) VALUES (?, ?, ?)",
        [teamName, teamLeadId, teamDescription]
      );
      const teamId = result.insertId;

      // Insert team lead as a member of the team
      const [result2] = await db.execute(
        "INSERT INTO team_members (teamId, memberId) VALUES (?, ?)",
        [teamId, teamLeadId]
      );

      // Create a new Discord role for the team
      const newRole = await interaction.guild.roles.create({
        name: teamName,
        permissions: [],
      });

      // Assign the role to the team lead
      const guildMember = await interaction.guild.members.fetch(teamLeadId);
      await guildMember.roles.add(newRole);

      await interaction.reply({
        content: `Team '${teamName}' created successfully with ${teamLead.username} as the team lead!`,
        ephemeral: false,
      });
    } catch (error) {
      console.error("Error creating team:", error);
      await interaction.reply({
        content: "There was an error creating the team.",
        ephemeral: true,
      });
    }
  }

  // Add to Team Command
  if (interaction.commandName === "add-to-team") {
    const teamName = interaction.options.getString("name");
    const member = interaction.options.getUser("member");

    try {
      const [rows] = await db.execute(
        "SELECT id, name, leadId FROM teams WHERE name = ?",
        [teamName]
      );
      if (rows.length === 0) {
        return interaction.reply({
          content: "Team not found.",
          ephemeral: true,
        });
      }

      const team = rows[0];

      if (interaction.user.id !== team.leadId.toString()) {
        return interaction.reply({
          content: "You do not have permission to add members to this team.",
          ephemeral: true,
        });
      }

      await db.execute(
        "INSERT INTO team_members (teamId, memberId) VALUES (?, ?)",
        [team.id, member.id]
      );
      const teamRole = interaction.guild.roles.cache.find(
        (role) => role.name === team.name
      );
      if (teamRole) {
        const guildMember = await interaction.guild.members.fetch(member.id);
        await guildMember.roles.add(teamRole);
      }

      await interaction.reply({
        content: `${member.username} has been added to '${team.name}'!`,
        ephemeral: false,
      });
    } catch (error) {
      console.error("Error adding member to team:", error);
      await interaction.reply({
        content: "There was an error adding the member to the team.",
        ephemeral: true,
      });
    }
  }
});
