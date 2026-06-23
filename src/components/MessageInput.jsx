import { useState, useRef, useEffect } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { httpsCallable } from 'firebase/functions'
import { db, storage, functions } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { activeMentionQuery } from '../lib/mentions'
import { formatDuration } from '../lib/formatDuration'
import { useTypingWriter } from '../hooks/useTypingWriter'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import TypingIndicator from './TypingIndicator'

function quotedTextFor(message) {
  return message.deleted ? 'הודעה זו נמחקה' : message.text
}

export default function MessageInput({ roomId, replyingTo, onCancelReply, allUsers = [] }) {
  const [text, setText] = useState('')
  const [error, setError] = useState(null)
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [mentionQuery, setMentionQuery] = useState(null)
  const [mentionedUsers, setMentionedUsers] = useState([])
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)
  const { user } = useAuth()
  const { notifyTyping, clearTyping } = useTypingWriter(roomId)
  const { isRecording, durationSeconds, startRecording, stopRecording } = useVoiceRecorder(handleRecordingComplete)
  const [suggestions, setSuggestions] = useState(null)

  async function handleRequestSuggestions() {
    setSuggestions({ loading: true })
    try {
      const suggestReplies = httpsCallable(functions, 'suggestReplies')
      const result = await suggestReplies({ roomId })
      setSuggestions({ list: result.data.suggestions })
    } catch {
      setSuggestions({ error: true })
    }
  }

  const mentionMatches = mentionQuery === null
    ? []
    : allUsers.filter((candidate) => candidate.displayName.toLowerCase().includes(mentionQuery.toLowerCase()))

  function handleTextChange(event) {
    const value = event.target.value
    setText(value)
    setMentionQuery(activeMentionQuery(value, event.target.selectionStart))
    setHighlightedIndex(0)
    notifyTyping()
  }

  function selectMention(candidate) {
    const cursorPos = textareaRef.current.selectionStart
    const atIndex = text.slice(0, cursorPos).lastIndexOf('@')
    setText(text.slice(0, atIndex) + `@${candidate.displayName} ` + text.slice(cursorPos))
    setMentionedUsers((prev) => [...prev, candidate])
    setMentionQuery(null)
  }

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }, [text])

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

  async function handleRecordingComplete(blob, duration) {
    setError(null)
    setUploading(true)
    try {
      const storageRef = ref(storage, `rooms/${roomId}/voice_${Date.now()}.webm`)
      await uploadBytes(storageRef, blob)
      const audioURL = await getDownloadURL(storageRef)
      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        type: 'voice',
        audioURL,
        duration,
        userId: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        timestamp: serverTimestamp(),
      })
    } catch (err) {
      console.error('Error sending voice message:', err)
      setError(err.message)
    } finally {
      setUploading(false)
    }
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

      const mentionedCandidates = mentionedUsers.filter((candidate) => text.includes(`@${candidate.displayName}`))
      const mentions = mentionedCandidates.map((candidate) => candidate.uid)
      const mentionedNames = mentionedCandidates.map((candidate) => candidate.displayName)

      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        text: text.trim(),
        userId: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        timestamp: serverTimestamp(),
        ...(fileURL && { fileURL, fileName, fileType }),
        ...(replyingTo && {
          replyTo: {
            messageId: replyingTo.id,
            text: quotedTextFor(replyingTo),
            displayName: replyingTo.displayName,
          },
        }),
        ...(mentions.length > 0 && { mentions, mentionedNames }),
      })
      setText('')
      setFile(null)
      setMentionedUsers([])
      onCancelReply?.()
      clearTyping()
    } catch (err) {
      console.error('Error sending message:', err)
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  // הצעה נשלחת כהודעת טקסט פשוטה, בלי קובץ מצורף — addDoc נפרד ולא דרך handleSubmit/sendMessage משותף
  // בכוונה: שיתוף פונקציה אחת עם שני קוראים (handleSubmit + כאן) בלבל את ניתוח ה-call-graph של
  // react-hooks/purity וסימן את ה-Date.now() (בקוד העלאת קובץ) כלא-טהור, אותה משפחת באג כמו ב-Mentions (#22).
  async function handleSendSuggestion(suggestion) {
    setError(null)
    setUploading(true)
    try {
      await addDoc(collection(db, 'rooms', roomId, 'messages'), {
        text: suggestion,
        userId: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        timestamp: serverTimestamp(),
        ...(replyingTo && {
          replyTo: {
            messageId: replyingTo.id,
            text: quotedTextFor(replyingTo),
            displayName: replyingTo.displayName,
          },
        }),
      })
      setSuggestions(null)
      onCancelReply?.()
      clearTyping()
    } catch (err) {
      console.error('Error sending suggestion:', err)
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  function handleEditSuggestion(suggestion) {
    setText(suggestion)
    setSuggestions(null)
    textareaRef.current?.focus()
  }

  function handleTextareaKeyDown(event) {
    if (mentionMatches.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setHighlightedIndex((i) => Math.min(i + 1, mentionMatches.length - 1))
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setHighlightedIndex((i) => Math.max(i - 1, 0))
        return
      }
      if (event.key === 'Enter') {
        event.preventDefault()
        selectMention(mentionMatches[highlightedIndex])
        return
      }
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.target.form?.requestSubmit()
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white">
      <TypingIndicator roomId={roomId} />
      {replyingTo && (
        <div className="px-4 pt-3 pb-1 flex items-center gap-2">
          <div className="flex-1 min-w-0 border-r-2 border-[#F08C30] pr-2">
            <p dir="auto" className="text-xs font-semibold text-[#F08C30]">מגיב/ה ל-{replyingTo.displayName}</p>
            <p dir="auto" className="text-xs text-gray-500 truncate">{quotedTextFor(replyingTo)}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label="Cancel reply"
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XIcon />
          </button>
        </div>
      )}
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

      {suggestions && !suggestions.loading && (
        <div className="px-4 pb-1 flex flex-wrap items-center gap-2">
          {suggestions.error && <p className="text-xs text-red-500">משהו השתבש בהצעות, נסו שוב.</p>}
          {suggestions.list?.length === 0 && <p className="text-xs text-gray-400">אין הצעות כרגע.</p>}
          {suggestions.list?.map((suggestion, index) => (
            <div key={index} className="flex items-center gap-1 bg-[#F08C30]/10 text-[#F08C30] rounded-full pr-3 pl-1 py-1 text-xs" dir="auto">
              <button
                type="button"
                onClick={() => handleSendSuggestion(suggestion)}
                className="hover:underline"
              >
                {suggestion}
              </button>
              <button
                type="button"
                onClick={() => handleEditSuggestion(suggestion)}
                aria-label="ערוך הצעה"
                className="text-[#F08C30] hover:bg-[#F08C30]/20 rounded-full p-1 transition-colors"
              >
                <PencilIcon />
              </button>
            </div>
          ))}
        </div>
      )}

      {mentionMatches.length > 0 && (
        <div className="px-4 pb-1">
          <ul className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden max-h-40 overflow-y-auto">
            {mentionMatches.map((candidate, index) => (
              <li key={candidate.uid}>
                <button
                  type="button"
                  onClick={() => selectMention(candidate)}
                  className={`w-full text-right px-3 py-1.5 text-sm transition-colors ${
                    index === highlightedIndex ? 'bg-[#F08C30]/10 text-[#F08C30]' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {candidate.displayName}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

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
        <button
          type="button"
          onClick={isRecording ? stopRecording : startRecording}
          aria-label={isRecording ? 'Stop recording' : 'Record voice message'}
          className={`transition-colors shrink-0 ${isRecording ? 'text-red-500' : 'text-gray-400 hover:text-[#F08C30]'}`}
        >
          {isRecording ? <StopIcon /> : <MicIcon />}
        </button>
        <button
          type="button"
          onClick={handleRequestSuggestions}
          disabled={suggestions?.loading}
          aria-label="הצע תגובות"
          aria-busy={!!suggestions?.loading}
          className="text-gray-400 hover:text-[#F08C30] transition-colors shrink-0 disabled:opacity-60"
        >
          {suggestions?.loading ? <SpinnerIcon /> : '💡'}
        </button>
        {isRecording && (
          <span data-testid="recording-duration" className="text-xs text-red-500 font-mono shrink-0">
            {formatDuration(durationSeconds)}
          </span>
        )}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleTextareaKeyDown}
          onBlur={clearTyping}
          placeholder="Message... (Shift+Enter for new line)"
          rows={1}
          className="flex-1 bg-gray-100 text-gray-800 placeholder-gray-400 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#F08C30]/50 border border-gray-200 resize-none"
          style={{ overflowY: 'auto' }}
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

function MicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function SpinnerIcon() {
  return (
    <div
      data-testid="suggestions-spinner"
      className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"
    />
  )
}

function XIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}
