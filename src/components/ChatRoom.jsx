import { useEffect, useRef, useState } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from '../firebase'
import { useChatContext } from '../contexts/ChatContext'
import { useMutedRooms } from '../hooks/useMutedRooms'
import { useAllUsers } from '../hooks/useAllUsers'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import WhoIsViewing from './WhoIsViewing'

export default function ChatRoom({ unreadCounts = {} }) {
  const { selectedRoom } = useChatContext()
  const { mutedRooms, toggleMute } = useMutedRooms()
  const allUsers = useAllUsers()
  const isMuted = !!mutedRooms[selectedRoom]
  const [replyingTo, setReplyingTo] = useState(null)
  const [replyRoom, setReplyRoom] = useState(selectedRoom)
  const [unreadSnapshot, setUnreadSnapshot] = useState({ count: 0, asOf: null })
  const [summary, setSummary] = useState(null)
  const frozenRoomRef = useRef(null)

  if (selectedRoom !== replyRoom) {
    setReplyRoom(selectedRoom)
    setReplyingTo(null)
    setSummary(null)
  }

  // נקודת העוגן (asOf) חייבת להיקפא ברגע הכניסה לחדר, לא ברגע הלחיצה על הכפתור —
  // אחרת הודעות חדשות שמגיעות בזמן שהמשתמש קורא ידחקו הודעות ישנות שלא נקראו מחוץ ל-limit() בשרת.
  // Date.now() הוא impure, אז זה רץ ב-effect ולא בזמן ה-render עצמו; ה-guard מבטיח שהקיפאון קורה רק
  // כשהחדר עצמו השתנה, לא בכל עדכון חי של unreadCounts (שגם הוא תלות, כדי ש-exhaustive-deps לא יתלונן).
  useEffect(() => {
    if (frozenRoomRef.current === selectedRoom) return
    frozenRoomRef.current = selectedRoom
    setUnreadSnapshot({ count: unreadCounts[selectedRoom] ?? 0, asOf: Date.now() })
  }, [selectedRoom, unreadCounts])

  async function handleSummarize() {
    setSummary({ loading: true })
    try {
      const summarizeUnread = httpsCallable(functions, 'summarizeUnread')
      const result = await summarizeUnread({
        roomId: selectedRoom,
        count: unreadSnapshot.count,
        asOf: unreadSnapshot.asOf,
      })
      setSummary({ text: result.data.summary })
    } catch {
      setSummary({ error: true })
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <div
        className="pl-16 pr-6 py-4 border-b border-white/8 md:px-6 flex items-center gap-3"
        style={{ background: 'linear-gradient(135deg, #1e1035 0%, #160c30 100%)' }}
      >
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[#F08C30] font-bold text-lg leading-none">#</span>
            <h2 className="text-white font-semibold text-lg capitalize leading-none">{selectedRoom}</h2>
          </div>
          <p className="text-white/30 text-xs mt-1">
            {selectedRoom === 'general' && 'Company-wide announcements and general discussion'}
            {selectedRoom === 'development' && 'Engineering, code reviews and tech discussion'}
            {selectedRoom === 'design' && 'UI/UX, design systems and visual direction'}
            {selectedRoom === 'soc' && 'Security operations, alerts and compliance'}
            {selectedRoom === 'management' && 'Leadership updates and strategy'}
            {selectedRoom === 'devops' && 'Infrastructure, CI/CD and deployments'}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-3 shrink-0">
          <WhoIsViewing roomId={selectedRoom} />
          {unreadSnapshot.count > 0 && (
            <button
              aria-label="תעדכן אותי"
              onClick={handleSummarize}
              disabled={summary?.loading}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 text-white/80 hover:bg-white/20 disabled:opacity-60 transition-colors"
            >
              {summary?.loading ? 'מסכם...' : 'תעדכן אותי'}
            </button>
          )}
          <button
            aria-label={isMuted ? `Unmute #${selectedRoom}` : `Mute #${selectedRoom}`}
            onClick={() => toggleMute(selectedRoom)}
            className={`p-2 rounded-lg transition-colors ${isMuted ? 'text-[#F08C30]' : 'text-white/40 hover:text-white/80 hover:bg-white/8'}`}
          >
            <BellIcon muted={isMuted} />
          </button>
        </div>
      </div>
      {summary && !summary.loading && (
        <div className="px-6 py-3 bg-[#F08C30]/10 border-b border-[#F08C30]/20 flex items-start gap-3">
          <p className="text-sm text-gray-700 flex-1" dir="auto">
            {summary.error ? 'משהו השתבש בסיכום, נסו שוב.' : summary.text}
          </p>
          <button
            aria-label="סגור סיכום"
            onClick={() => setSummary(null)}
            className="text-gray-400 hover:text-gray-600 shrink-0"
          >
            ✕
          </button>
        </div>
      )}
      <MessageList roomId={selectedRoom} onReply={setReplyingTo} allUsers={allUsers} />
      <MessageInput roomId={selectedRoom} replyingTo={replyingTo} onCancelReply={() => setReplyingTo(null)} allUsers={allUsers} />
    </div>
  )
}

function BellIcon({ muted }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      {muted && <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />}
    </svg>
  )
}
