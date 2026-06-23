import { useTypingUsers } from '../hooks/useTypingUsers'
import { useForceRecheck } from '../hooks/useForceRecheck'
import { isTypingFresh } from '../lib/isTypingFresh'

function typingLabel(names) {
  if (names.length === 1) return `${names[0]} מקליד/ה...`
  if (names.length === 2) return `${names[0]} ו-${names[1]} מקלידים/ות...`
  return `${names[0]} ועוד ${names.length - 1} מקלידים/ות...`
}

export default function TypingIndicator({ roomId }) {
  const typingUsers = useTypingUsers(roomId)

  useForceRecheck(1000)

  const activeNames = typingUsers
    .filter((candidate) => isTypingFresh(candidate.timestamp))
    .map((candidate) => candidate.displayName)

  if (activeNames.length === 0) return null

  return (
    <p className="px-4 pt-2 text-xs text-gray-500 italic">
      {typingLabel(activeNames)}
    </p>
  )
}
