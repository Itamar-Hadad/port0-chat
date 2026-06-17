import { useState } from 'react'

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
  const { text, displayName, photoURL, timestamp, fileURL, fileName, fileType } = message

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
    <div className="self-end translate-y-2 shrink-0">
      <Avatar displayName={displayName} photoURL={photoURL} />
    </div>
  )

  return (
    <div className={`flex gap-2 mb-3 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && avatarEl}
      <div className="flex flex-col max-w-xs">
        <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs text-gray-500 font-semibold">{displayName}</span>
          {timeLabel && <span className="text-xs text-gray-400">{timeLabel}</span>}
        </div>
        <div className="relative">
          <div
            className={`px-3 py-2 text-sm ${
              isOwn
                ? 'bg-[#0d0620] text-white rounded-2xl rounded-br-none'
                : 'bg-gray-200 text-gray-800 rounded-2xl rounded-bl-none'
            }`}
            dir="auto"
          >
            {text && <span>{text}</span>}
            {fileURL && (
              <FileAttachment fileURL={fileURL} fileName={fileName} fileType={fileType} isOwn={isOwn} />
            )}
          </div>
          <div style={isOwn ? ownTail : otherTail} />
        </div>
      </div>
      {isOwn && avatarEl}
    </div>
  )
}
