export function isOnline(lastSeen, { now = Date.now() } = {}) {
  if (!lastSeen) return false
  return lastSeen.toMillis() >= now - 60000
}
