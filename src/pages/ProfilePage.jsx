import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateProfile } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [bio, setBio] = useState('')
  const [role, setRole] = useState('')
  const [photoURL, setPhotoURL] = useState(user?.photoURL ?? null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => {
    async function loadProfile() {
      const snap = await getDoc(doc(db, 'users', user.uid))
      if (snap.exists()) {
        const data = snap.data()
        if (data.displayName) setDisplayName(data.displayName)
        if (data.role)        setRole(data.role)
        if (data.bio)         setBio(data.bio)
        if (data.photoURL)    setPhotoURL(data.photoURL)
      }
    }
    loadProfile()
  }, [user.uid])

  async function handleFileChange(event) {
    const file = event.target.files[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setPhotoURL(previewUrl)
    setUploading(true)

    try {
      setUploadError('')
      const storageRef = ref(storage, `avatars/${user.uid}`)
      await uploadBytes(storageRef, file)
      const url = await getDownloadURL(storageRef)
      await updateProfile(user, { photoURL: url })
      await setDoc(doc(db, 'users', user.uid), { photoURL: url }, { merge: true })
      setPhotoURL(url)
      URL.revokeObjectURL(previewUrl)
    } catch (err) {
      console.error('Upload failed:', err)
      setUploadError('Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    await updateProfile(user, { displayName })
    await setDoc(doc(db, 'users', user.uid), { displayName, role, bio }, { merge: true })
    setSaving(false)
    navigate('/chat')
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-[#0d0620] flex items-center justify-center p-4">
      <div className="bg-[#130a2e] rounded-2xl shadow-2xl w-full max-w-md p-8 flex flex-col items-center gap-6">

        {/* Header */}
        <div className="w-full flex items-center gap-3">
          <button
            onClick={() => navigate('/chat')}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Back to chat"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-white text-2xl font-bold tracking-tight">Profile</h1>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Avatar */}
        <div
          onClick={() => fileInputRef.current.click()}
          className="relative cursor-pointer group"
          title="Click to change photo"
        >
          {photoURL ? (
            <img
              src={photoURL}
              alt="avatar"
              className="w-24 h-24 rounded-full object-cover ring-2 ring-[#F08C30]"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#F08C30] flex items-center justify-center ring-2 ring-[#F08C30]">
              <span className="text-white text-3xl font-bold">
                {displayName?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            {uploading ? (
              <span className="text-white text-xs">...</span>
            ) : (
              <span className="text-white text-xs font-medium">Change</span>
            )}
          </div>
        </div>

        <p className="text-gray-400 text-sm -mt-2">{user?.email}</p>
        {uploadError && (
          <p className="text-red-400 text-xs text-center">{uploadError}</p>
        )}

        {/* Display name */}
        <div className="w-full flex flex-col gap-2">
          <label className="text-gray-300 text-sm font-medium">Display Name</label>
          <input
            type="text"
            dir="auto"
            value={displayName}
            onChange={event => setDisplayName(event.target.value)}
            className="bg-[#0d0620] border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#F08C30]/50 placeholder-gray-500"
            placeholder="Your name"
          />
        </div>

        {/* Role */}
        <div className="w-full flex flex-col gap-2">
          <label className="text-gray-300 text-sm font-medium">Role</label>
          <input
            type="text"
            dir="auto"
            value={role}
            onChange={event => setRole(event.target.value)}
            className="bg-[#0d0620] border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#F08C30]/50 placeholder-gray-500"
            placeholder="e.g. Developer, Designer..."
          />
        </div>

        {/* Bio */}
        <div className="w-full flex flex-col gap-2">
          <label className="text-gray-300 text-sm font-medium">Bio</label>
          <textarea
            dir="auto"
            value={bio}
            onChange={event => setBio(event.target.value)}
            rows={3}
            maxLength={160}
            className="bg-[#0d0620] border border-white/10 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#F08C30]/50 placeholder-gray-500 resize-none"
            placeholder="Tell us about yourself..."
          />
          <span className="text-gray-500 text-xs text-right">{bio.length}/160</span>
        </div>

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#F08C30] hover:bg-[#D37B2A] disabled:opacity-60 text-white font-semibold text-sm py-2.5 rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="w-full border border-white/20 hover:border-white/40 text-gray-300 hover:text-white font-medium text-sm py-2.5 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  )
}
