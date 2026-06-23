function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

export function getDaySeparatorLabel(timestamp, { now = Date.now() } = {}) {
  if (!timestamp) return null
  const date = timestamp.toDate()
  const diffDays = Math.round((startOfDay(new Date(now)) - startOfDay(date)) / 86400000)

  if (diffDays === 0) return 'היום'
  if (diffDays === 1) return 'אתמול'
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function isSameDay(timestampA, timestampB) {
  if (!timestampA || !timestampB) return false
  return startOfDay(timestampA.toDate()) === startOfDay(timestampB.toDate())
}
