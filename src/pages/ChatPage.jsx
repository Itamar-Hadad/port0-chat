import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import ChatRoom from '../components/ChatRoom'
import { usePresence } from '../hooks/usePresence'
import { useUnreadCounts } from '../hooks/useUnreadCounts'

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  usePresence()
  const { unreadCounts } = useUnreadCounts()

  return (
    <div className="flex h-screen bg-[#0d0620] overflow-hidden">
      {/* hamburger button — mobile only */}
      <button
        className="fixed top-4 left-4 z-30 md:hidden text-white bg-[#130a2e] p-2 rounded-lg"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        ☰
      </button>

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        unreadCounts={unreadCounts}
      />

      <main className="flex-1 flex flex-col md:ml-0 overflow-hidden">
        <ChatRoom unreadCounts={unreadCounts} />
      </main>
    </div>
  )
}
