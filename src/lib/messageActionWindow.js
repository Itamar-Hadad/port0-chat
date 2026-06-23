export function canModifyMessage(timestamp, { now = Date.now(), windowMs = 15 * 60 * 1000 } = {}) {
  if (!timestamp) return false
  return now - timestamp.toMillis() < windowMs
}
