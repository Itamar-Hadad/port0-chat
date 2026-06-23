const { isViewingRoom } = require('./isViewingRoom')

function shouldSendPush({ activeRoom, isVisible, mutedRooms, mentions, roomId, recipientUid }) {
  const isMuted = !!(mutedRooms && mutedRooms[roomId])
  const isMentioned = !!(mentions && mentions.includes(recipientUid))
  return !isViewingRoom({ activeRoom, isVisible, roomId }) && (!isMuted || isMentioned)
}

module.exports = { shouldSendPush }
