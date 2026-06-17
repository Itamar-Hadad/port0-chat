import { useState, useRef } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../firebase'
import { useAuth } from '../contexts/AuthContext'

export default function MessageInput({ roomId }) {
  const [text, setText] = useState('')
  const [error, setError] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)
  const { user } = useAuth()

  function handleFileChange(event) {
    const selected = event.target.files[0]
    if (!selected) return
    if (selected.size > 100 * 1024 * 1024) {
      setError('File too large (max 100MB)')
      return
    }
    setFile(selected)
    setError(null)
    event.target.value = ''
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!text.trim() && !file) return
    setError(null)
    setUploading(true)
    try {
      let fileURL = null
      let fileName = null
      let fileType = null

      if (file) {
        const storageRef = ref(storage, `rooms/${roomId}/${Date.now()}_${file.name}`)
        await uploadBytes(storageRef, file)
        fileURL = await getDownloadURL(storageRef)
        fileName = file.name
        fileType = file.type
      }

      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        text: text.trim(),
        userId: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        timestamp: serverTimestamp(),
        ...(fileURL && { fileURL, fileName, fileType }),
      })
      setText('')
      setFile(null)
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white">
      {file && (
        <div className="px-4 pt-3 pb-1 flex items-center gap-2">
          {file.type.startsWith('image/') ? (
            <img
              src={URL.createObjectURL(file)}
              alt=""
              className="h-16 w-16 object-cover rounded-lg border border-gray-200"
            />
          ) : (
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700">
              <DocumentIcon />
              <span className="truncate max-w-[180px]">{file.name}</span>
            </div>
          )}
          <button
            type="button"
            onClick={() => setFile(null)}
            aria-label="Remove file"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon />
          </button>
        </div>
      )}

      {error && <p className="px-4 pt-2 text-xs text-red-500">{error}</p>}

      <form
        aria-label="message form"
        onSubmit={handleSubmit}
        className="flex items-center gap-3 px-4 py-3"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
          className="hidden"
          data-testid="file-input"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current.click()}
          aria-label="Attach file"
          className="text-gray-400 hover:text-[#F08C30] transition-colors shrink-0"
        >
          <PaperclipIcon />
        </button>
        <input
          type="text"
          value={text}
          onChange={event => setText(event.target.value)}
          placeholder="Message..."
          className="flex-1 bg-gray-100 text-gray-800 placeholder-gray-400 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#F08C30]/50 border border-gray-200"
        />
        <button
          type="submit"
          disabled={uploading}
          className="bg-[#F08C30] hover:bg-[#D37B2A] disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
        >
          {uploading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

function PaperclipIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 00-5.656-5.656L5.757 10.757a6 6 0 108.486 8.486L20 13.5" />
    </svg>
  )
}

function DocumentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
