// src/commands/addrule.js
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("addrule")
    .setDescription("Adds a new rule to the rules channel.")
    .addStringOption((option) =>
      option
        .setName("text")
        .setDescription("The rule text to add")
        .setRequired(true)
    ),
  async execute(interaction) {
    // Retrieve the text input for the rule from the command option.
    const ruleText = interaction.options.getString("text");

    // Build an embed with the provided rule text.
    const embed = new EmbedBuilder()
      .setTitle("Rules")
      .setDescription(ruleText)
      .setColor("#00b0f4")
      .setTimestamp();

    // You can either hard-code the rules channel ID or store it in an environment variable.
    // For example, if you have a RULES_CHANNEL_ID in your .env file:
    const rulesChannelId =
      process.env.RULES_CHANNEL_ID || "1326744506732642415";

    // Retrieve the channel from the client's cache.
    const rulesChannel = interaction.client.channels.cache.get(rulesChannelId);
    if (!rulesChannel) {
      return interaction.reply({
        content: "Rules channel not found!",
        ephemeral: true,
      });
    }

    try {
      // Send the embed to the rules channel.
      await rulesChannel.send({ embeds: [embed] });
      // Confirm the command to the user.
      await interaction.reply({
        content: "Rule added successfully!",
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error sending rule embed:", error);
      await interaction.reply({
        content: "There was an error adding the rule.",
        ephemeral: true,
      });
    }
  },
};
