import { createContext, useContext, useState } from 'react'

const ChatContext = createContext(null)

export function useChatContext() {
  return useContext(ChatContext)
}

export function ChatProvider({ children }) {
  const [selectedRoom, setSelectedRoom] = useState('general')

  return (
    <ChatContext.Provider value={{ selectedRoom, setSelectedRoom }}>
      {children}
    </ChatContext.Provider>
  )
}
