import { useState } from 'react'
import Avatar from './Avatar'
import ProfileModal from './ProfileModal'
import { useRoomViewers } from '../hooks/useRoomViewers'
import { useForceRecheck } from '../hooks/useForceRecheck'
import { isOnline } from '../lib/isOnline'

export default function WhoIsViewing({ roomId }) {
  const viewers = useRoomViewers(roomId)
  const [openProfileUid, setOpenProfileUid] = useState(null)

  useForceRecheck(10000)

  const openProfileViewer = viewers.find((viewer) => viewer.uid === openProfileUid)

  return (
    <div className="flex items-center -space-x-2 rtl:space-x-reverse">
      {viewers.map((viewer) => (
        <button
          key={viewer.uid}
          data-testid="viewer-avatar"
          onClick={() => setOpenProfileUid(viewer.uid)}
          className="relative"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <Avatar displayName={viewer.displayName} photoURL={viewer.photoURL} sizeClassName="w-7 h-7 text-xs ring-2 ring-[#1e1035]" />
          {isOnline(viewer.lastSeen) && (
            <span data-testid="online-dot" className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-[#1e1035]" />
          )}
        </button>
      ))}

      {openProfileViewer && (
        <ProfileModal
          uid={openProfileViewer.uid}
          displayName={openProfileViewer.displayName}
          photoURL={openProfileViewer.photoURL}
          onClose={() => setOpenProfileUid(null)}
        />
      )}
    </div>
  )
}
