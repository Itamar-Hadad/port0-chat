const { onRequest, onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const Anthropic = require("@anthropic-ai/sdk");
const { handleNewMessage } = require("./onNewMessage");
const { handleMessageEdited } = require("./onMessageEdited");
const { handleSummarizeUnread } = require("./summarizeUnread");
const { handleSuggestReplies } = require("./suggestReplies");

admin.initializeApp();

const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

function requireAuth(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "התחברות נדרשת");
  }
}

function createAnthropicClient() {
  return new Anthropic({ apiKey: anthropicApiKey.value() });
}

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

exports.summarizeUnread = onCall(
  { secrets: [anthropicApiKey] },
  (request) => {
    requireAuth(request);
    return handleSummarizeUnread({
      roomId: request.data.roomId,
      count: request.data.count,
      asOf: request.data.asOf,
      db: admin.firestore(),
      anthropic: createAnthropicClient(),
    });
  }
);

exports.suggestReplies = onCall(
  { secrets: [anthropicApiKey] },
  (request) => {
    requireAuth(request);
    return handleSuggestReplies({
      roomId: request.data.roomId,
      db: admin.firestore(),
      anthropic: createAnthropicClient(),
    });
  }
);
