function describeMessageText(message) {
  if (message.deleted) return '[הודעה נמחקה]'
  if (message.type === 'voice') return `[הודעה קולית, ${message.duration} שניות]`
  return message.text
}

function formatMessageTranscript(messages) {
  return messages.map((message) => `${message.displayName}: ${describeMessageText(message)}`).join('\n')
}

module.exports = { formatMessageTranscript }
