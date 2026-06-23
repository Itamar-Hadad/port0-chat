import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export function useTypingUsers(roomId) {
  const { user } = useAuth()
  const [typingUsers, setTypingUsers] = useState([])

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'rooms', roomId, 'typing'), (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }))
      setTypingUsers(docs.filter((candidate) => candidate.uid !== user?.uid))
    })
    return unsubscribe
  }, [roomId, user])

  return typingUsers
}
