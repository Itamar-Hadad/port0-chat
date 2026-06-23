import { useState, useEffect } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'

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

export default function ProfileModal({ uid, displayName, photoURL, onClose }) {
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
