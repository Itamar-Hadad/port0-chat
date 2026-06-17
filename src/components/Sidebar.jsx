import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useChatContext } from '../contexts/ChatContext'
import port0Logo from '../assets/Port0-logo.png'

const ROOMS = ['general', 'development', 'design', 'soc', 'management', 'devops']

const ROOM_ICONS = {
  general: '💬',
  development: '💻',
  design: '🎨',
  soc: '🔒',
  management: '📋',
  devops: '⚙️',
}

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()
  const { selectedRoom, setSelectedRoom } = useChatContext()
  const navigate = useNavigate()

  function handleRoomClick(room) {
    setSelectedRoom(room)
    onClose()
  }

  return (
    <>
      {isOpen && (
        <div
          data-testid="sidebar-overlay"
          className="fixed inset-0 bg-black/50 z-10 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-full w-64 z-20
        flex flex-col
        transition-transform duration-300
        md:relative md:translate-x-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
        style={{ background: 'linear-gradient(180deg, #1a0d3d 0%, #130a2e 60%, #0f0825 100%)' }}
      >
        {/* logo header */}
        <div className="px-5 py-5 border-b border-white/10 flex items-center gap-3">
          <img
            src={port0Logo}
            alt="Port0"
            className="h-7 w-auto filter brightness-0 invert"
          />
          <span className="text-white/40 text-xs font-medium tracking-widest uppercase">Chat</span>
        </div>

        {/* channels label */}
        <div className="px-5 pt-5 pb-2">
          <span className="text-white/30 text-[10px] font-semibold tracking-widest uppercase">Channels</span>
        </div>

        {/* room list */}
        <nav className="flex-1 overflow-y-auto pb-2 px-3">
          {ROOMS.map((room) => (
            <button
              key={room}
              aria-label={`#${room}`}
              onClick={() => handleRoomClick(room)}
              className={`
                w-full text-left px-3 py-2.5 rounded-lg mb-0.5 text-sm font-medium
                flex items-center gap-2.5
                transition-all duration-150
                ${selectedRoom === room
                  ? 'bg-[#F08C30] text-white shadow-lg shadow-orange-900/30'
                  : 'text-white/50 hover:bg-white/8 hover:text-white/90'}
              `}
            >
              <span className={`text-base leading-none ${selectedRoom === room ? 'opacity-100' : 'opacity-60'}`}>
                {ROOM_ICONS[room]}
              </span>
              <span># {room}</span>
              {selectedRoom === room && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/80" />
              )}
            </button>
          ))}
        </nav>

        {/* user info */}
        <div className="px-4 py-4 border-t border-white/10"
          style={{ background: 'rgba(0,0,0,0.2)' }}
        >
          <button
            aria-label="Go to profile"
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-white/8 transition-all group"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F08C30] to-[#D37B2A] flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md"
            >
              {user?.photoURL
                ? <img src={user.photoURL} alt="" className="w-full h-full rounded-full object-cover" />
                : user?.displayName?.[0]?.toUpperCase() ?? '?'
              }
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-white text-sm font-medium truncate group-hover:text-[#F08C30] transition-colors">
                {user?.displayName}
              </p>
              <p className="text-white/30 text-xs truncate">{user?.email}</p>
            </div>
            <svg className="w-3.5 h-3.5 text-white/30 group-hover:text-[#F08C30] transition-colors shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </aside>
    </>
  )
}
