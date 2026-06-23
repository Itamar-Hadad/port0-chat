const { shouldSendPush } = require('./shouldSendPush')
const { isMessageEdit } = require('./isMessageEdit')

async function handleMessageEdited({ roomId, before, after, db, messaging }) {
  if (!isMessageEdit({ before, after })) {
    console.log(`onMessageEdited: skip room=${roomId} - not an edit`)
    return
  }

  console.log(`onMessageEdited: room=${roomId} sender=${after.userId} text="${after.text}"`)

  const usersSnap = await db.collection('users').get()

  const recipients = usersSnap.docs
    .filter((doc) => doc.id !== after.userId)
    .map((doc) => ({ uid: doc.id, user: doc.data() }))

  const sends = recipients
    .filter(({ uid, user }) => {
      if (!user.fcmToken) {
        console.log(`onMessageEdited: skip ${uid} - no fcmToken registered`)
        return false
      }
      return true
    })
    .filter(({ uid, user }) => {
      const send = shouldSendPush({
        activeRoom: user.activeRoom,
        isVisible: user.isVisible,
        mutedRooms: user.mutedRooms,
        mentions: after.mentions,
        roomId,
        recipientUid: uid,
      })
      console.log(`onMessageEdited: ${uid} activeRoom=${user.activeRoom} isVisible=${user.isVisible} muted=${!!(user.mutedRooms && user.mutedRooms[roomId])} -> send=${send}`)
      return send
    })
    .map(({ uid, user }) => messaging.send({
      token: user.fcmToken,
      notification: {
        title: `${after.displayName} • #${roomId}`,
        body: after.text,
      },
    }).then(
      () => console.log(`onMessageEdited: push sent to ${uid}`),
      (err) => console.error(`onMessageEdited: push FAILED for ${uid}: ${err.message}`)
    ))

  return Promise.all(sends)
}

module.exports = { handleMessageEdited }
