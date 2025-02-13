const { client } = require("../index");
const { EmbedBuilder, AuditLogEvent, Colors } = require("discord.js"); // Use Colors enum
require("dotenv").config({ path: __dirname + "/./../../.env" });

const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

// Helper function to send logs
async function sendLog(embed) {
  const logChannel = client.channels.cache.get(LOG_CHANNEL_ID);
  if (logChannel) {
    logChannel.send({ embeds: [embed] });
  }
}

// Event: Member Kicked or Banned
client.on("guildMemberRemove", async (member) => {
  const logs = await member.guild.fetchAuditLogs({
    type: AuditLogEvent.MemberKick,
  });
  const kickLog = logs.entries.first();

  const embed = new EmbedBuilder()
    .setTitle("🚨 Member Removed")
    .setColor(Colors.Red) // ✅ Fix: Use Colors enum instead of "RED"
    .setTimestamp();

  if (kickLog && kickLog.target.id === member.id) {
    embed.setDescription(
      `**${member.user.tag}** was kicked by **${kickLog.executor.tag}**.`
    );
  } else {
    embed.setDescription(`**${member.user.tag}** left the server.`);
  }

  sendLog(embed);
});

// Update all embed colors to use `Colors.<Color>` instead of strings
client.on("interactionCreate", (interaction) => {
  if (!interaction.isCommand()) return;

  const embed = new EmbedBuilder()
    .setTitle("⚙️ Command Used")
    .setColor(Colors.Blue) // ✅ Fix: Using Colors enum
    .setDescription(
      `**User:** ${interaction.user.tag}\n` +
        `**Command:** ${interaction.commandName}\n` +
        `**Channel:** ${interaction.channel.name}`
    )
    .setTimestamp();

  sendLog(embed);
});

client.on("messageDelete", async (message) => {
  if (!message.guild || message.author.bot) return;

  const embed = new EmbedBuilder()
    .setTitle("🗑 Message Deleted")
    .setColor(Colors.Orange) // ✅ Fix
    .setDescription(
      `**User:** ${message.author.tag}\n` +
        `**Channel:** ${message.channel.name}\n` +
        `**Content:** ${message.content || "No Content"}`
    )
    .setTimestamp();

  sendLog(embed);
});

client.on("messageUpdate", async (oldMessage, newMessage) => {
  if (
    !oldMessage.guild ||
    oldMessage.author.bot ||
    oldMessage.content === newMessage.content
  )
    return;

  const embed = new EmbedBuilder()
    .setTitle("✏️ Message Edited")
    .setColor(Colors.Yellow) // ✅ Fix
    .setDescription(
      `**User:** ${oldMessage.author.tag}\n` +
        `**Channel:** ${oldMessage.channel.name}\n` +
        `**Before:** ${oldMessage.content}\n` +
        `**After:** ${newMessage.content}`
    )
    .setTimestamp();

  sendLog(embed);
});

// Ensure all other embed colors are updated similarly...

console.log("✅ Server logging system loaded!");
