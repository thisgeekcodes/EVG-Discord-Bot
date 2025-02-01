module.exports = {

function checkMessage() {
  client.on("messageCreate", (message) => {
    // Check if the message is in the specific channel
    if (message.channelId === "1326421629441540096") {
      // Check if the message has attachments (media)
      if (!message.attachments.size) {
        message.delete();
        // Optionally send a message to the user explaining why
        message.author.send(
          "Your message in #highlights was deleted because it did not contain any media. Picture/Video"
        );
      }
    }
  });
}

};
