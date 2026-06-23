export function activeMentionQuery(text, cursorPos) {
  const match = text.slice(0, cursorPos).match(/@(\S*)$/)
  return match ? match[1] : null
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function splitMentionSegments(text, displayNames) {
  if (displayNames.length === 0) return [{ text, isMention: false }]

  const pattern = displayNames.map((name) => `@${escapeRegExp(name)}`).join('|')
  const regex = new RegExp(`(${pattern})`, 'g')
  const parts = text.split(regex)

  return parts
    .filter((part) => part !== '')
    .map((part) => ({ text: part, isMention: displayNames.some((name) => part === `@${name}`) }))
}
