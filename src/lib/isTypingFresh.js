export function isTypingFresh(timestamp, { now = Date.now(), staleMs = 3000 } = {}) {
  if (!timestamp) return false
  return now - timestamp.toMillis() < staleMs
}
