import { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export function useAllUsers() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ uid: doc.id, ...doc.data() }))
      setUsers(docs.filter((candidate) => candidate.uid !== user?.uid))
    })
    return unsubscribe
  }, [user])

  return users
}
