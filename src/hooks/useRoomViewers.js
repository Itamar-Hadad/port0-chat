import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export function useRoomViewers(roomId) {
  const { user } = useAuth()
  const [viewers, setViewers] = useState([])

  useEffect(() => {
    const q = query(collection(db, 'users'), where('activeRoom', '==', roomId))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }))
      setViewers(docs.filter((viewer) => viewer.uid !== user?.uid))
    })
    return unsubscribe
  }, [roomId, user])

  return viewers
}
