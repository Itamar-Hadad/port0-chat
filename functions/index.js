const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const { handleNewMessage } = require("./onNewMessage");
const { handleMessageEdited } = require("./onMessageEdited");

admin.initializeApp();

exports.helloWorld = onRequest((req, res) => {
  res.send("Hello from port0-chat Cloud Functions!");
});

exports.onNewMessage = onDocumentCreated(
  "rooms/{roomId}/messages/{messageId}",
  (event) => handleNewMessage({
    roomId: event.params.roomId,
    message: event.data.data(),
    db: admin.firestore(),
    messaging: admin.messaging(),
    increment: admin.firestore.FieldValue.increment,
  })
);

exports.onMessageEdited = onDocumentUpdated(
  "rooms/{roomId}/messages/{messageId}",
  (event) => handleMessageEdited({
    roomId: event.params.roomId,
    before: event.data.before.data(),
    after: event.data.after.data(),
    db: admin.firestore(),
    messaging: admin.messaging(),
  })
);
