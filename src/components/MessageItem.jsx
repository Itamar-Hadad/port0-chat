import { useRef, useState } from 'react'
import { doc, updateDoc, serverTimestamp, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import Avatar from './Avatar'
import ProfileModal from './ProfileModal'
import { canModifyMessage } from '../lib/messageActionWindow'
import { splitMentionSegments } from '../lib/mentions'
import { formatDuration } from '../lib/formatDuration'

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

function PencilIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  )
}

function ReplyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17L4 12M4 12L9 7M4 12H15.5C18.5376 12 21 14.4624 21 17.5V18" />
    </svg>
  )
}

function SmileIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm5.25 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z" />
    </svg>
  )
}

function InlineActions({ onCancel, cancelLabel, onConfirm, confirmLabel, confirmClassName }) {
  return (
    <div className="flex gap-3 justify-end text-xs font-semibold">
      <button type="button" onClick={onCancel} className="opacity-70 hover:opacity-100">
        {cancelLabel}
      </button>
      <button type="button" onClick={onConfirm} className={confirmClassName}>
        {confirmLabel}
      </button>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
    </svg>
  )
}

function VoicePlayer({ audioURL, duration, isOwn }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  function togglePlay() {
    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  return (
    <div className="flex items-center gap-2 mt-1">
      <audio ref={audioRef} src={audioURL} onEnded={() => setIsPlaying(false)} />
      <button
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
        className={`shrink-0 rounded-full p-1.5 transition-colors ${
          isOwn ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
        }`}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>
      <span className={`text-xs font-mono ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>{formatDuration(duration)}</span>
    </div>
  )
}

function FileAttachment({ fileURL, fileName, fileType, isOwn }) {
  if (fileType?.startsWith('image/')) {
    return (
      <a href={fileURL} target="_blank" rel="noopener noreferrer" className="block mt-2">
        <img
          src={fileURL}
          alt={fileName}
          className="max-w-[240px] max-h-[200px] rounded-lg object-cover border border-white/10"
        />
      </a>
    )
  }

  return (
    <a
      href={fileURL}
      target="_blank"
      rel="noopener noreferrer"
      className={`mt-2 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-opacity hover:opacity-80 ${
        isOwn ? 'bg-white/10 text-white' : 'bg-white text-gray-700 border border-gray-200'
      }`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="truncate max-w-[180px]">{fileName}</span>
    </a>
  )
}

export default function MessageItem({ message, isOwn, roomId, onReply, allUsers = [] }) {
  const { text, displayName, photoURL, timestamp, fileURL, fileName, fileType, userId, editedAt, deleted, replyTo, mentionedNames, reactions, type, audioURL, duration } = message
  const { user: currentUser } = useAuth()
  const [profileOpen, setProfileOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(text)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const canModify = !deleted && isOwn && canModifyMessage(timestamp)

  function updateMessage(fields) {
    return updateDoc(doc(db, 'rooms', roomId, 'messages', message.id), fields)
  }

  function resolveReactorName(uid) {
    if (uid === currentUser?.uid) return currentUser.displayName
    return allUsers.find((candidate) => candidate.uid === uid)?.displayName || uid
  }

  const nonEmptyReactions = Object.entries(reactions || {}).filter(([, uids]) => uids?.length > 0)

  async function toggleReaction(emoji) {
    const reactors = reactions?.[emoji] || []
    const update = reactors.includes(currentUser.uid) ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
    await updateMessage({ [`reactions.${emoji}`]: update })
    setPickerOpen(false)
  }

  async function saveEdit() {
    await updateMessage({ text: editText.trim(), editedAt: serverTimestamp() })
    setIsEditing(false)
  }

  async function deleteMessage() {
    await updateMessage({ deleted: true })
    setConfirmingDelete(false)
  }

  const timeLabel = timestamp
    ? timestamp.toDate().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
    : null

  const ownTail = {
    position: 'absolute', bottom: 0, right: -8,
    width: 0, height: 0,
    borderTop: '8px solid transparent',
    borderLeft: '8px solid #0d0620',
  }
  const otherTail = {
    position: 'absolute', bottom: 0, left: -8,
    width: 0, height: 0,
    borderTop: '8px solid transparent',
    borderRight: '8px solid #e5e7eb',
  }

  const avatarEl = (
    <button
      onClick={() => userId && setProfileOpen(true)}
      className="self-end translate-y-2 shrink-0 transition-opacity hover:opacity-75"
      style={{ background: 'none', border: 'none', padding: 0, cursor: userId ? 'pointer' : 'default' }}
    >
      <Avatar displayName={displayName} photoURL={photoURL} />
    </button>
  )

  return (
    <>
      <div id={`message-${message.id}`} className={`flex gap-2 mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        {!isOwn && avatarEl}
        <div className={`flex flex-col max-w-xs ${isOwn ? 'items-end' : 'items-start'}`}>
          <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-gray-500 font-semibold">{displayName}</span>
            {timeLabel && <span className="text-xs text-gray-400">{timeLabel}</span>}
            {editedAt && <span className="text-xs text-gray-400 italic">(edited)</span>}
            {canModify && !isEditing && (
              <button
                aria-label="Edit message"
                onClick={() => { setEditText(text); setIsEditing(true) }}
                className="text-gray-400 hover:text-[#F08C30] transition-colors"
              >
                <PencilIcon />
              </button>
            )}
            {canModify && !confirmingDelete && (
              <button
                aria-label="Delete message"
                onClick={() => setConfirmingDelete(true)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <TrashIcon />
              </button>
            )}
            {!isEditing && !confirmingDelete && (
              <button
                aria-label="Reply to message"
                onClick={() => onReply?.(message)}
                className="text-gray-400 hover:text-[#F08C30] transition-colors"
              >
                <ReplyIcon />
              </button>
            )}
            {!isEditing && !confirmingDelete && !deleted && (
              <div className="relative">
                <button
                  aria-label="Add reaction"
                  onClick={() => setPickerOpen((open) => !open)}
                  className="text-gray-400 hover:text-[#F08C30] transition-colors"
                >
                  <SmileIcon />
                </button>
                {pickerOpen && (
                  <div data-testid="reaction-picker" className={`absolute z-10 top-full mt-1 flex gap-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1.5 ${isOwn ? 'right-0' : 'left-0'}`}>
                    {REACTION_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => toggleReaction(emoji)}
                        className="text-base hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <div
              className={`px-3 py-2 text-sm w-fit ${
                isOwn
                  ? 'bg-[#0d0620] text-white rounded-2xl rounded-br-none'
                  : 'bg-gray-200 text-gray-800 rounded-2xl rounded-bl-none'
              }`}
              dir="auto"
            >
              {confirmingDelete ? (
                <div className="flex flex-col gap-2 min-w-[160px]">
                  <span>למחוק את ההודעה?</span>
                  <InlineActions
                    onCancel={() => setConfirmingDelete(false)}
                    cancelLabel="לא"
                    onConfirm={deleteMessage}
                    confirmLabel="כן"
                    confirmClassName="text-red-500 hover:opacity-80"
                  />
                </div>
              ) : deleted ? (
                <span className="italic opacity-70">הודעה זו נמחקה</span>
              ) : isEditing ? (
                <div className="flex flex-col gap-2 min-w-[160px]">
                  <textarea
                    value={editText}
                    onChange={event => setEditText(event.target.value)}
                    rows={2}
                    className="bg-transparent outline-none resize-none text-sm w-full"
                  />
                  <InlineActions
                    onCancel={() => setIsEditing(false)}
                    cancelLabel="Cancel"
                    onConfirm={saveEdit}
                    confirmLabel="Save"
                    confirmClassName="text-[#F08C30] hover:opacity-80"
                  />
                </div>
              ) : (
                <>
                  {replyTo && (
                    <div
                      data-testid="reply-quote"
                      role="button"
                      tabIndex={0}
                      onClick={() => document.getElementById(`message-${replyTo.messageId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                      className={`mb-1.5 px-2 py-1 rounded border-r-2 cursor-pointer ${
                        isOwn ? 'border-white/40 bg-white/10' : 'border-gray-400 bg-gray-100'
                      }`}
                    >
                      <p dir="auto" className={`text-xs font-semibold ${isOwn ? 'text-white/70' : 'text-gray-500'}`}>{replyTo.displayName}</p>
                      <p dir="auto" className={`text-xs truncate ${isOwn ? 'text-white/60' : 'text-gray-500'}`}>{replyTo.text}</p>
                    </div>
                  )}
                  {text && (
                    <span dir="auto" style={{ whiteSpace: 'pre-wrap' }}>
                      {splitMentionSegments(text, mentionedNames || []).map((segment, index) =>
                        segment.isMention ? (
                          <strong key={index} data-testid="mention" className={isOwn ? 'text-[#F08C30]' : 'text-[#7c3aed]'}>
                            {segment.text}
                          </strong>
                        ) : (
                          <span key={index}>{segment.text}</span>
                        )
                      )}
                    </span>
                  )}
                  {fileURL && (
                    <FileAttachment fileURL={fileURL} fileName={fileName} fileType={fileType} isOwn={isOwn} />
                  )}
                  {type === 'voice' && (
                    <VoicePlayer audioURL={audioURL} duration={duration} isOwn={isOwn} />
                  )}
                </>
              )}
            </div>
            <div style={isOwn ? ownTail : otherTail} />
          </div>
          {nonEmptyReactions.length > 0 && (
            <div className={`flex gap-1 mt-1 flex-wrap ${isOwn ? 'justify-end' : 'justify-start'}`}>
              {nonEmptyReactions.map(([emoji, uids]) => (
                <button
                  key={emoji}
                  type="button"
                  data-testid={`reaction-pill-${emoji}`}
                  onClick={() => toggleReaction(emoji)}
                  className={`relative group text-xs px-1.5 py-0.5 rounded-full border flex items-center gap-1 ${
                    uids.includes(currentUser?.uid) ? 'border-[#F08C30] bg-[#F08C30]/10' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <span>{emoji}</span>
                  <span>{uids.length}</span>
                  <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block whitespace-nowrap bg-[#0d0620] text-white text-xs px-2 py-1 rounded shadow-lg z-20">
                    {uids.map(resolveReactorName).join(', ')}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        {isOwn && avatarEl}
      </div>

      {profileOpen && userId && (
        <ProfileModal
          uid={userId}
          displayName={displayName}
          photoURL={photoURL}
          onClose={() => setProfileOpen(false)}
        />
      )}
    </>
  )
}
