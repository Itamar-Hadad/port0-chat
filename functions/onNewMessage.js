const { shouldSendPush } = require('./shouldSendPush')
const { isViewingRoom } = require('./isViewingRoom')

async function handleNewMessage({ roomId, message, db, messaging, increment }) {
  console.log(`onNewMessage: room=${roomId} sender=${message.userId} text="${message.text}"`)

  const usersSnap = await db.collection('users').get()

  const recipients = usersSnap.docs
    .filter((doc) => doc.id !== message.userId)
    .map((doc) => ({ uid: doc.id, user: doc.data() }))

  const unreadWrites = recipients
    .filter(({ user }) => !isViewingRoom({ activeRoom: user.activeRoom, isVisible: user.isVisible, roomId }))
    .map(({ uid }) => db.collection('users').doc(uid).update({
      [`unreadCounts.${roomId}`]: increment(1),
    }))

  const sends = recipients
    .filter(({ uid, user }) => {
      if (!user.fcmToken) {
        console.log(`onNewMessage: skip ${uid} - no fcmToken registered`)
        return false
      }
      return true
    })
    .filter(({ uid, user }) => {
      const send = shouldSendPush({
        activeRoom: user.activeRoom,
        isVisible: user.isVisible,
        mutedRooms: user.mutedRooms,
        mentions: message.mentions,
        roomId,
        recipientUid: uid,
      })
      console.log(`onNewMessage: ${uid} activeRoom=${user.activeRoom} isVisible=${user.isVisible} muted=${!!(user.mutedRooms && user.mutedRooms[roomId])} -> send=${send}`)
      return send
    })
    .map(({ uid, user }) => messaging.send({
      token: user.fcmToken,
      notification: {
        title: `${message.displayName} • #${roomId}`,
        body: message.text,
      },
    }).then(
      () => console.log(`onNewMessage: push sent to ${uid}`),
      (err) => console.error(`onNewMessage: push FAILED for ${uid}: ${err.message}`)
    ))

  return Promise.all([...unreadWrites, ...sends])
}

module.exports = { handleNewMessage }
