import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  GoogleAuthProvider,
} from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { auth, db } from '../firebase'

export const AuthContext = createContext(null)

export function useAuth() {
  return useContext(AuthContext)
}

const googleProvider = new GoogleAuthProvider()

function profileFields(user) {
  const fields = { displayName: user.displayName }
  if (user.photoURL) fields.photoURL = user.photoURL
  return fields
}

function syncUserProfile(uid, fields) {
  return setDoc(doc(db, 'users', uid), fields, { merge: true })
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function login(email, password) {
    const credential = await signInWithEmailAndPassword(auth, email, password)
    await syncUserProfile(credential.user.uid, profileFields(credential.user))
    return credential
  }

  function logout() {
    return signOut(auth)
  }

  async function register(name, email, password) {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName: name })
    await syncUserProfile(credential.user.uid, { displayName: name })
    return credential
  }

  async function googleSignIn() {
    const credential = await signInWithPopup(auth, googleProvider)
    await syncUserProfile(credential.user.uid, profileFields(credential.user))
    return credential
  }

  const value = { user, login, logout, register, googleSignIn }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}