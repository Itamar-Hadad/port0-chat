import { Fragment, useEffect, useRef, useState } from 'react'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../contexts/AuthContext'
import { getDaySeparatorLabel, isSameDay } from '../lib/dateSeparator'
import MessageItem from './MessageItem'

function lastTimestampBefore(messages, index) {
  for (let i = index - 1; i >= 0; i--) {
    if (messages[i].timestamp) return messages[i].timestamp
  }
  return null
}

function DateSeparator({ label }) {
  return (
    <div className="flex justify-center my-3">
      <span className="text-xs font-medium text-gray-400 bg-gray-200/70 px-3 py-1 rounded-full">
        {label}
      </span>
    </div>
  )
}

export default function MessageList({ roomId, onReply, allUsers }) {
  const [messages, setMessages] = useState([])
  const { user } = useAuth()
  const containerRef = useRef(null)
  const bottomRef = useRef(null)
  const snapshotCount = useRef(0)

  useEffect(() => {
    snapshotCount.current = 0
    const q = query(
      collection(db, 'rooms', roomId, 'messages'),
      orderBy('timestamp', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshotCount.current++
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })

    return unsubscribe
  }, [roomId])

  useEffect(() => {
    if (messages.length === 0) return
    if (snapshotCount.current <= 1) {
      bottomRef.current?.scrollIntoView({ behavior: 'instant' })
      return
    }
    const container = containerRef.current
    if (!container) return
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    if (distanceFromBottom < 100) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-gray-50">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-14 h-14 text-gray-300">
          <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0112 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.901 48.901 0 01-3.476.383.39.39 0 00-.297.17l-2.755 4.133a.75.75 0 01-1.248 0l-2.755-4.133a.39.39 0 00-.297-.17 48.9 48.9 0 01-3.476-.384c-1.978-.29-3.348-2.024-3.348-3.97V6.741c0-1.946 1.37-3.68 3.348-3.97z" clipRule="evenodd" />
        </svg>
        <p className="text-gray-500 text-base font-semibold">No messages yet</p>
        <p className="text-gray-400 text-sm">Be the first to say something!</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto bg-gray-50">
      <div className="flex flex-col justify-end min-h-full p-4">
        {messages.map((msg, index) => {
          const showSeparator = msg.timestamp && !isSameDay(msg.timestamp, lastTimestampBefore(messages, index))

          return (
            <Fragment key={msg.id}>
              {showSeparator && <DateSeparator label={getDaySeparatorLabel(msg.timestamp)} />}
              <MessageItem message={msg} isOwn={msg.userId === user?.uid} roomId={roomId} onReply={onReply} allUsers={allUsers} />
            </Fragment>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
