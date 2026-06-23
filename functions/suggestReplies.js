const { formatMessageTranscript } = require('./formatMessageTranscript')

const RECENT_MESSAGES_LIMIT = 10
const MAX_SUGGESTIONS = 3

const SUGGESTIONS_SCHEMA = {
  type: 'object',
  properties: {
    suggestions: { type: 'array', items: { type: 'string' } },
  },
  required: ['suggestions'],
  additionalProperties: false,
}

async function handleSuggestReplies({ roomId, db, anthropic }) {
  const messagesSnap = await db
    .collection('rooms')
    .doc(roomId)
    .collection('messages')
    .orderBy('timestamp', 'desc')
    .limit(RECENT_MESSAGES_LIMIT)
    .get()

  if (messagesSnap.docs.length === 0) {
    return { suggestions: [] }
  }

  const messages = messagesSnap.docs.map((doc) => doc.data()).reverse()
  const transcript = formatMessageTranscript(messages)

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: 'אתה מציע תגובות קצרות וטבעיות בעברית להמשך שיחת צ\'אט, בהתבסס על ההודעות האחרונות. הצע 2-3 תגובות קצרות, מגוונות ומתאימות להקשר.',
    messages: [{ role: 'user', content: transcript }],
    output_config: { format: { type: 'json_schema', schema: SUGGESTIONS_SCHEMA } },
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  const parsed = JSON.parse(textBlock?.text ?? '{"suggestions":[]}')
  return { suggestions: parsed.suggestions.slice(0, MAX_SUGGESTIONS) }
}

module.exports = { handleSuggestReplies }
