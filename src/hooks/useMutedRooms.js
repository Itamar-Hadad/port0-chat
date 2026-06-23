import { useEffect, useState } from 'react'
import { doc, getDoc, updateDoc, deleteField } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export function useMutedRooms() {
  const { user } = useAuth()
  const [mutedRooms, setMutedRooms] = useState({})

  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      setMutedRooms(snap.data()?.mutedRooms ?? {})
    })
  }, [user])

  function toggleMute(roomId) {
    const isMuted = !!mutedRooms[roomId]

    setMutedRooms((current) => {
      const next = { ...current }
      if (isMuted) {
        delete next[roomId]
      } else {
        next[roomId] = true
      }
      return next
    })

    updateDoc(
      doc(db, 'users', user.uid),
      { [`mutedRooms.${roomId}`]: isMuted ? deleteField() : true }
    )
  }

  return { mutedRooms, toggleMute }
}
