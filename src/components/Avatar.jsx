import { useState } from 'react'

export default function Avatar({ displayName, photoURL, sizeClassName = 'w-8 h-8 text-sm' }) {
  const [imgError, setImgError] = useState(false)
  const initial = displayName?.[0]?.toUpperCase() ?? '?'

  if (photoURL && !imgError) {
    return (
      <img
        src={photoURL}
        alt={displayName}
        className={`rounded-full object-cover shrink-0 ${sizeClassName}`}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div className={`rounded-full bg-[#F08C30] flex items-center justify-center text-white font-bold shrink-0 ${sizeClassName}`}>
      {initial}
    </div>
  )
}
