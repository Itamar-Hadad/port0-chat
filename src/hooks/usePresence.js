import { useEffect } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getMessaging, getToken } from 'firebase/messaging'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { useChatContext } from '../contexts/ChatContext'

function writeUserPresence(uid, fields) {
  return setDoc(doc(db, 'users', uid), fields, { merge: true })
}

async function registerFcmToken(uid) {
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return

  const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
  const messaging = getMessaging()
  const token = await getToken(messaging, {
    vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    serviceWorkerRegistration: registration,
  })
  if (token) {
    await writeUserPresence(uid, { fcmToken: token })
  }
}

export function usePresence() {
  const { user } = useAuth()
  const { selectedRoom } = useChatContext()

  useEffect(() => {
    if (!user) return
    writeUserPresence(user.uid, { activeRoom: selectedRoom })
  }, [user, selectedRoom])

  useEffect(() => {
    if (!user) return

    function updateVisibility() {
      writeUserPresence(user.uid, { isVisible: document.visibilityState === 'visible' })
    }

    updateVisibility()
    document.addEventListener('visibilitychange', updateVisibility)
    return () => document.removeEventListener('visibilitychange', updateVisibility)
  }, [user])

  useEffect(() => {
    if (!user) return
    registerFcmToken(user.uid)
  }, [user])

  useEffect(() => {
    if (!user) return

    function sendHeartbeat() {
      writeUserPresence(user.uid, { lastSeen: serverTimestamp() })
    }

    sendHeartbeat()
    const interval = setInterval(sendHeartbeat, 30000)
    return () => clearInterval(interval)
  }, [user])
}
