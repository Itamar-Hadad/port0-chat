import { useRef } from 'react'
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

const WRITE_THROTTLE_MS = 2000
const IDLE_CLEAR_MS = 3000

export function useTypingWriter(roomId) {
  const { user } = useAuth()
  const lastWriteAt = useRef(0)
  const idleTimer = useRef(null)

  function clearTyping() {
    clearTimeout(idleTimer.current)
    deleteDoc(doc(db, 'rooms', roomId, 'typing', user.uid))
      .catch((err) => console.error('useTypingWriter: deleteDoc failed:', err))
  }

  function notifyTyping() {
    const now = Date.now()
    if (now - lastWriteAt.current >= WRITE_THROTTLE_MS) {
      lastWriteAt.current = now
      setDoc(doc(db, 'rooms', roomId, 'typing', user.uid), {
        displayName: user.displayName,
        timestamp: serverTimestamp(),
      }).catch((err) => console.error('useTypingWriter: setDoc failed:', err))
    }
    clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(clearTyping, IDLE_CLEAR_MS)
  }

  return { notifyTyping, clearTyping }
}
