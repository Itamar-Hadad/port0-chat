import { useEffect, useState } from 'react'
import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useChatContext } from '../contexts/ChatContext'

export function useUnreadCounts() {
  const { user } = useAuth()
  const { selectedRoom } = useChatContext()
  const [unreadCounts, setUnreadCounts] = useState({})
  const [isVisible, setIsVisible] = useState(document.visibilityState === 'visible')

  useEffect(() => {
    if (!user) return
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      setUnreadCounts(snap.data()?.unreadCounts ?? {})
    })
    return unsubscribe
  }, [user])

  useEffect(() => {
    function updateVisibility() {
      setIsVisible(document.visibilityState === 'visible')
    }
    document.addEventListener('visibilitychange', updateVisibility)
    return () => document.removeEventListener('visibilitychange', updateVisibility)
  }, [])

  useEffect(() => {
    if (!user) return
    if (isVisible && unreadCounts[selectedRoom] > 0) {
      updateDoc(doc(db, 'users', user.uid), { [`unreadCounts.${selectedRoom}`]: 0 })
    }
  }, [user, selectedRoom, unreadCounts, isVisible])

  return { unreadCounts }
}
