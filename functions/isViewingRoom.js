function isViewingRoom({ activeRoom, isVisible, roomId }) {
  return activeRoom === roomId && isVisible === true
}

module.exports = { isViewingRoom }
