import { useChatContext } from '../contexts/ChatContext'
import MessageList from './MessageList'
import MessageInput from './MessageInput'

export default function ChatRoom() {
  const { selectedRoom } = useChatContext()

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
      </div>
      <MessageList roomId={selectedRoom} />
      <MessageInput roomId={selectedRoom} />
    </div>
  )
}
