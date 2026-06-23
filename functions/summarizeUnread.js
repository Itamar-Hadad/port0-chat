const { formatMessageTranscript } = require('./formatMessageTranscript')

const MAX_MESSAGES = 50

async function handleSummarizeUnread({ roomId, count, asOf, db, anthropic }) {
  const safeCount = Math.min(count ?? 0, MAX_MESSAGES)

  if (safeCount <= 0) {
    return { summary: 'אין הודעות חדשות לסכם.' }
  }

  const messagesSnap = await db
    .collection('rooms')
    .doc(roomId)
    .collection('messages')
    .where('timestamp', '<=', new Date(asOf))
    .orderBy('timestamp', 'desc')
    .limit(safeCount)
    .get()

  const messages = messagesSnap.docs.map((doc) => doc.data()).reverse()
  const transcript = formatMessageTranscript(messages)

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: 'אתה מסכם שיחות צ\'אט בעברית. תן סיכום קצר ובהיר (2-4 משפטים) של מה שפוספס, בלי הקדמות או הערות מטא.',
    messages: [{ role: 'user', content: transcript }],
  })

  const textBlock = response.content.find((block) => block.type === 'text')
  return { summary: textBlock?.text ?? '' }
}

module.exports = { handleSummarizeUnread }
