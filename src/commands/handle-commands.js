const path = require("node:path");
require("dotenv").config({ path: __dirname + "/./../../.env" });

const { eventEmitter } = require("./../index.js"); // Import event emitter
const { EmbedBuilder } = require("discord.js");

// Listen for interactions
eventEmitter.on("interaction", async (interaction) => {
  if (!interaction.isCommand()) return;

  //////////// add rule ///////////////////

  if (interaction.commandName === "addrule") {
    // Retrieve options
    const fieldName = interaction.options.getString("name");
    const ruleText = interaction.options.getString("rule");
    // Validate lengths per Discord's constraints:
    if (!fieldName || fieldName.length === 0) {
      return interaction.reply({
        content: "The field name cannot be empty.",
        ephemeral: true,
      });
    }
    if (fieldName.length > 256) {
      return interaction.reply({
        content:
          "The field name is too long. Please limit it to 256 characters.",
        ephemeral: true,
      });
    }
    if (!ruleText || ruleText.length === 0) {
      return interaction.reply({
        content: "The rule text cannot be empty.",
        ephemeral: true,
      });
    }
    if (ruleText.length > 1024) {
      return interaction.reply({
        content:
          "The rule text is too long. Please limit it to 1024 characters.",
        ephemeral: true,
      });
    }

    // Determine the rules channel ID from environment (or replace with your channel ID)
    const rulesChannelId =
      process.env.RULES_CHANNEL_ID || "YOUR_RULES_CHANNEL_ID";
    const rulesChannel = interaction.client.channels.cache.get(rulesChannelId);

    if (!rulesChannel) {
      return interaction.reply({
        content: "Rules channel not found!",
        ephemeral: true,
      });
    }

    // Fetch recent messages in the rules channel and try to find the bot's persistent message
    let rulesMessage;
    try {
      const fetchedMessages = await rulesChannel.messages.fetch({ limit: 10 });
      // Look for a message from the bot with an embed titled "Rules"
      rulesMessage = fetchedMessages.find(
        (m) =>
          m.author.id === interaction.client.user.id &&
          m.embeds.length > 0 &&
          m.embeds[0].title &&
          m.embeds[0].title.toLowerCase() === "rules"
      );
    } catch (err) {
      console.error("Error fetching messages:", err);
    }

    // If no message exists, create a new one.
    if (!rulesMessage) {
      try {
        const newEmbed = new EmbedBuilder()
          .setTitle("Rules")
          .setColor("#00b0f4")
          .setTimestamp()
          .setFooter({
            text: "👇👇  **Click the green check to agree** 👇👇",
          });
        rulesMessage = await rulesChannel.send({ embeds: [newEmbed] });
        // React with a checkmark emoji to indicate the persistent message was created.
        await rulesMessage.react("✅");
      } catch (err) {
        console.error("Error sending initial rules message:", err);
        return interaction.reply({
          content: "Failed to create the rules message.",
          ephemeral: true,
        });
      }
    }

    // Retrieve the existing embed from the message and update it.
    // Since embeds are immutable, we create a new one from the existing embed.
    const oldEmbed = rulesMessage.embeds[0];
    const updatedEmbed = EmbedBuilder.from(oldEmbed);

    // Add the new rule as a field.
    updatedEmbed.addFields({
      name: fieldName,
      value: ruleText,
      inline: false,
    });

    // Edit the persistent message with the updated embed.
    try {
      await rulesMessage.edit({ embeds: [updatedEmbed] });
      await interaction.reply({
        content: "Rule added successfully!",
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error editing the rules message:", error);
      await interaction.reply({
        content: "There was an error updating the rules.",
        ephemeral: true,
      });
    }
  }
  //////////// edit rule ///////////////////
  if (interaction.commandName === "editrule") {
    // Retrieve options from the command
    const fieldName = interaction.options.getString("name");
    const newRuleText = interaction.options.getString("rule");

    // Validate input lengths per Discord’s limits
    if (!fieldName || fieldName.length === 0) {
      return interaction.reply({
        content: "The field name cannot be empty.",
        ephemeral: true,
      });
    }
    if (fieldName.length > 256) {
      return interaction.reply({
        content:
          "The field name is too long. Please limit it to 256 characters.",
        ephemeral: true,
      });
    }
    if (!newRuleText || newRuleText.length === 0) {
      return interaction.reply({
        content: "The rule text cannot be empty.",
        ephemeral: true,
      });
    }
    if (newRuleText.length > 1024) {
      return interaction.reply({
        content:
          "The rule text is too long. Please limit it to 1024 characters.",
        ephemeral: true,
      });
    }

    // Retrieve the rules channel (using environment variable or fallback)
    const rulesChannelId =
      process.env.RULES_CHANNEL_ID || "YOUR_RULES_CHANNEL_ID";
    const rulesChannel = interaction.client.channels.cache.get(rulesChannelId);
    if (!rulesChannel) {
      return interaction.reply({
        content: "Rules channel not found!",
        ephemeral: true,
      });
    }

    // Fetch recent messages in the rules channel to locate the persistent rules message
    let rulesMessage;
    try {
      const fetchedMessages = await rulesChannel.messages.fetch({ limit: 10 });
      // Find the message from the bot with an embed titled "Rules"
      rulesMessage = fetchedMessages.find(
        (m) =>
          m.author.id === interaction.client.user.id &&
          m.embeds.length > 0 &&
          m.embeds[0].title &&
          m.embeds[0].title.toLowerCase() === "rules"
      );
    } catch (err) {
      console.error("Error fetching messages:", err);
      return interaction.reply({
        content: "Error fetching rules message.",
        ephemeral: true,
      });
    }

    if (!rulesMessage) {
      return interaction.reply({
        content:
          "No persistent rules message found. Please add a rule first using /addrule.",
        ephemeral: true,
      });
    }

    // Clone the existing embed to update it
    const oldEmbed = rulesMessage.embeds[0];
    const updatedEmbed = EmbedBuilder.from(oldEmbed);
    const fields = updatedEmbed.data.fields || [];

    // Look for the field matching the provided field name (case-insensitive)
    const index = fields.findIndex(
      (field) => field.name.toLowerCase() === fieldName.toLowerCase()
    );

    if (index === -1) {
      return interaction.reply({
        content: `No rule found with the field name "${fieldName}".`,
        ephemeral: true,
      });
    }

    // Update the field value with the new rule text
    fields[index].value = newRuleText;
    updatedEmbed.setFields(fields);

    // Edit the persistent rules message with the updated embed
    try {
      await rulesMessage.edit({ embeds: [updatedEmbed] });
      await interaction.reply({
        content: "Rule updated successfully!",
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error editing the rules message:", error);
      await interaction.reply({
        content: "There was an error updating the rule.",
        ephemeral: true,
      });
    }
  }

  //////////// Delete rule ///////////////////

  if (interaction.commandName === "deleterule") {
    // Retrieve the field option (the rule identifier)
    const fieldName = interaction.options.getString("name");

    // Validate input
    if (!fieldName || fieldName.trim().length === 0) {
      return interaction.reply({
        content: "The field name cannot be empty.",
        ephemeral: true,
      });
    }
    if (fieldName.length > 256) {
      return interaction.reply({
        content:
          "The field name is too long. Please limit it to 256 characters.",
        ephemeral: true,
      });
    }

    // Retrieve the rules channel from environment or fallback
    const rulesChannelId =
      process.env.RULES_CHANNEL_ID || "YOUR_RULES_CHANNEL_ID";
    const rulesChannel = interaction.client.channels.cache.get(rulesChannelId);
    if (!rulesChannel) {
      return interaction.reply({
        content: "Rules channel not found!",
        ephemeral: true,
      });
    }

    // Fetch recent messages in the rules channel and locate the persistent rules message
    let rulesMessage;
    try {
      const fetchedMessages = await rulesChannel.messages.fetch({ limit: 10 });
      rulesMessage = fetchedMessages.find(
        (m) =>
          m.author.id === interaction.client.user.id &&
          m.embeds.length > 0 &&
          m.embeds[0].title &&
          m.embeds[0].title.toLowerCase() === "rules"
      );
    } catch (err) {
      console.error("Error fetching messages:", err);
      return interaction.reply({
        content: "Error fetching the rules message.",
        ephemeral: true,
      });
    }

    if (!rulesMessage) {
      return interaction.reply({
        content:
          "No persistent rules message found. Please add a rule first using /addrule.",
        ephemeral: true,
      });
    }

    // Retrieve the existing embed and its fields.
    const oldEmbed = rulesMessage.embeds[0];
    const updatedEmbed = EmbedBuilder.from(oldEmbed);
    const fields = updatedEmbed.data.fields || [];

    // Look for the field with a matching name (case-insensitive)
    const index = fields.findIndex(
      (field) => field.name.toLowerCase() === fieldName.toLowerCase()
    );

    if (index === -1) {
      return interaction.reply({
        content: `No rule found with the field name "${fieldName}".`,
        ephemeral: true,
      });
    }

    // Remove the field from the array.
    fields.splice(index, 1);
    updatedEmbed.setFields(fields);

    // Edit the persistent rules message with the updated embed.
    try {
      await rulesMessage.edit({ embeds: [updatedEmbed] });
      await interaction.reply({
        content: "Rule deleted successfully!",
        ephemeral: true,
      });
    } catch (error) {
      console.error("Error editing the rules message:", error);
      await interaction.reply({
        content: "There was an error deleting the rule.",
        ephemeral: true,
      });
    }
  }
});
