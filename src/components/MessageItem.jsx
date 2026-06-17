import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

function Avatar({ displayName, photoURL }) {
  const [imgError, setImgError] = useState(false)
  const initial = displayName?.[0]?.toUpperCase() ?? '?'

  if (photoURL && !imgError) {
    return (
      <img
        src={photoURL}
        alt={displayName}
        className="w-8 h-8 rounded-full object-cover shrink-0"
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div className="w-8 h-8 rounded-full bg-[#F08C30] flex items-center justify-center text-white text-sm font-bold shrink-0">
      {initial}
    </div>
  )
}

function LargeAvatar({ displayName, photoURL }) {
  const [imgError, setImgError] = useState(false)
  const initial = displayName?.[0]?.toUpperCase() ?? '?'

  if (photoURL && !imgError) {
    return (
      <img
        src={photoURL}
        alt={displayName}
        className="w-24 h-24 rounded-full object-cover"
        style={{ border: '3px solid #F08C30', boxShadow: '0 0 0 3px rgba(240,140,48,0.2)' }}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div
      className="w-24 h-24 rounded-full bg-[#F08C30] flex items-center justify-center text-white text-4xl font-bold"
      style={{ border: '3px solid #F08C30', boxShadow: '0 0 0 3px rgba(240,140,48,0.2)' }}
    >
      {initial}
    </div>
  )
}

function ProfileModal({ uid, displayName, photoURL, onClose }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProfile() {
      try {
        const snap = await getDoc(doc(db, 'users', uid))
        setProfile(snap.exists() ? snap.data() : { displayName, photoURL })
      } catch {
        setProfile({ displayName, photoURL })
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [uid])

  const name = profile?.displayName ?? displayName
  const photo = profile?.photoURL ?? photoURL

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'linear-gradient(160deg, rgba(22,10,50,0.99) 0%, rgba(14,6,32,0.99) 100%)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '1.5rem',
          boxShadow: '0 0 0 1px rgba(109,40,217,0.2), 0 50px 100px rgba(0,0,0,0.7)',
          width: '100%',
          maxWidth: '380px',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '0.875rem', right: '0.875rem',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '0.5rem',
            color: 'rgba(255,255,255,0.5)',
            width: '30px', height: '30px',
            cursor: 'pointer',
            fontSize: '0.875rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'inherit',
          }}
        >
          ✕
        </button>

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '2rem', marginBottom: '1rem' }}>
          {loading ? (
            <div className="w-24 h-24 rounded-full bg-white/10 animate-pulse" style={{ border: '3px solid #F08C30' }} />
          ) : (
            <LargeAvatar displayName={name} photoURL={photo} />
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '0 2rem 2rem', textAlign: 'center' }}>
          {loading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-6 w-36 rounded-lg bg-white/10 animate-pulse" />
              <div className="h-4 w-24 rounded-full bg-white/10 animate-pulse" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: '1.25rem', marginBottom: '0.5rem', letterSpacing: '-0.01em' }}>
                  {name}
                </div>
                {profile?.role && (
                  <div style={{
                    display: 'inline-block',
                    background: 'rgba(240,140,48,0.15)',
                    border: '1px solid rgba(240,140,48,0.35)',
                    color: '#F08C30',
                    borderRadius: '999px',
                    padding: '0.25rem 0.875rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                  }}>
                    {profile.role}
                  </div>
                )}
              </div>

              {profile?.bio && (
                <>
                  <div style={{ width: '40px', height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.65, margin: 0, maxWidth: '280px' }}>
                    {profile.bio}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
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

export default function MessageItem({ message, isOwn }) {
  const { text, displayName, photoURL, timestamp, fileURL, fileName, fileType, userId } = message
  const [profileOpen, setProfileOpen] = useState(false)

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
      <div className={`flex gap-2 mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        {!isOwn && avatarEl}
        <div className={`flex flex-col max-w-xs ${isOwn ? 'items-end' : 'items-start'}`}>
          <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            <span className="text-xs text-gray-500 font-semibold">{displayName}</span>
            {timeLabel && <span className="text-xs text-gray-400">{timeLabel}</span>}
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
              {text && <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>}
              {fileURL && (
                <FileAttachment fileURL={fileURL} fileName={fileName} fileType={fileType} isOwn={isOwn} />
              )}
            </div>
            <div style={isOwn ? ownTail : otherTail} />
          </div>
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
