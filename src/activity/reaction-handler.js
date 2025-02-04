const { client } = require("../index");
require("dotenv").config({ path: __dirname + "/./../../.env" });

/**
 * Handler for adding a role when a user reacts with a checkmark (✅)
 * to the persistent "Rules" message.
 */
client.on("messageReactionAdd", async (reaction, user) => {
  // Ignore bot reactions.
  if (user.bot) return;

  // Ensure we have full data.
  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
  } catch (error) {
    console.error("Error fetching reaction or message:", error);
    return;
  }

  const message = reaction.message;

  // Check that the message is from our bot and has an embed with title "Rules"
  if (message.author.id !== client.user.id) return;
  if (message.embeds.length === 0) return;
  const embed = message.embeds[0];
  if (!embed.title || embed.title.toLowerCase() !== "rules") return;

  // Check that the reaction is the checkmark.
  if (reaction.emoji.name !== "✅") return;

  // Fetch the member who reacted.
  const guild = message.guild;
  if (!guild) return;
  let member;
  try {
    member = await guild.members.fetch(user.id);
  } catch (error) {
    console.error("Error fetching member:", error);
    return;
  }

  // Get the role to assign from the environment variable.
  const roleId = process.env.REACTION_ROLE_ID || "YOUR_ROLE_ID";
  const role = guild.roles.cache.get(roleId);
  if (!role) {
    console.error("Role not found:", roleId);
    return;
  }

  // Add the role to the member.
  try {
    await member.roles.add(role);
    console.log(`Added role ${role.name} to ${user.tag}`);
  } catch (error) {
    console.error("Failed to add role:", error);
  }
});

/**
 * Handler for removing a role when a user removes their checkmark (✅)
 * reaction from the persistent "Rules" message.
 */
client.on("messageReactionRemove", async (reaction, user) => {
  // Ignore bot reactions.
  if (user.bot) return;

  // Ensure we have full data.
  try {
    if (reaction.partial) await reaction.fetch();
    if (reaction.message.partial) await reaction.message.fetch();
  } catch (error) {
    console.error("Error fetching reaction or message:", error);
    return;
  }

  const message = reaction.message;

  // Check that the message is from our bot and has an embed titled "Rules"
  if (message.author.id !== client.user.id) return;
  if (message.embeds.length === 0) return;
  const embed = message.embeds[0];
  if (!embed.title || embed.title.toLowerCase() !== "rules") return;

  // Check that the reaction emoji is the checkmark.
  if (reaction.emoji.name !== "✅") return;

  // Fetch the member who removed their reaction.
  const guild = message.guild;
  if (!guild) return;
  let member;
  try {
    member = await guild.members.fetch(user.id);
  } catch (error) {
    console.error("Error fetching member:", error);
    return;
  }

  // Get the role to remove.
  const roleId = process.env.REACTION_ROLE_ID || "YOUR_ROLE_ID";
  const role = guild.roles.cache.get(roleId);
  if (!role) {
    console.error("Role not found:", roleId);
    return;
  }

  // Remove the role from the member.
  try {
    await member.roles.remove(role);
    console.log(`Removed role ${role.name} from ${user.tag}`);
  } catch (error) {
    console.error("Failed to remove role:", error);
  }
});

console.log("✅ Reaction handler loaded!");
