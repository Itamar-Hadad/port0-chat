function isMessageEdit({ before, after }) {
  if (!after.editedAt) return false
  if (!before.editedAt) return true
  return after.editedAt.toMillis() !== before.editedAt.toMillis()
}

module.exports = { isMessageEdit }
