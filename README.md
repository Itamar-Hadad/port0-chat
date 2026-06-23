<p align="center">
  <img src="src/assets/Port0-logo.png" width="130" />
</p>

<h1 align="center">Port0 Chat</h1>

<p align="center">
  <strong>Real time team communication, built on Firebase, styled for Port0.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=white"/>
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black"/>
  <img src="https://img.shields.io/badge/Cloud_Functions-FFCA28?style=flat-square&logo=firebase&logoColor=black"/>
  <img src="https://img.shields.io/badge/Claude_Sonnet_4.6-D97757?style=flat-square"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white"/>
  <img src="https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white"/>
</p>

<p align="center">
  <a href="https://port0-chat.vercel.app">
    <img src="https://img.shields.io/badge/🚀_port0--chat.vercel.app-F08C30?style=for-the-badge"/>
  </a>
</p>

---

## Overview

Port0 Chat is a real time messaging app built with Firebase and React. It supports multiple chat rooms with push notifications, presence, unread tracking, threaded-style replies, @mentions, emoji reactions, voice messages, and AI-powered conversation tools — on top of file sharing, user profiles, and authentication. Styled to match Port0's visual identity (deep purple dark theme, orange accents).

Built on the full Firebase ecosystem: **Firestore** for live data sync, **Authentication** for sign in, **Storage** for file uploads, **Cloud Functions** for server-side logic, and **Cloud Messaging** for push — with a **React + Vite** frontend and **Claude (Anthropic)** powering the AI features.

---

## ✨ Features

### 🔐 Authentication

- **Email & Password** registration with a live, 3 tier password strength indicator (length → letter → number)
- **Google Sign-In** one tap, zero friction
- Form-level validation with user friendly inline error messages
- Protected routes: unauthenticated users are automatically redirected to `/login`

---

### 💬 Real-Time Chat Rooms

Six dedicated channels out of the box: `#general`, `#development`, `#design`, `#soc`, `#management`, `#devops`

Messages are streamed live using **Firestore `onSnapshot`** — no polling, no page refreshes. Centered date separators ("Today" / "Yesterday" / date) divide the message list on every day change, WhatsApp-style.

**Smart auto-scroll engine:**

- On initial room load → jumps instantly to the latest message
- On new incoming message → smooth-scrolls only if the user is already near the bottom
- If a user is reading history → stays exactly in place

---

### 🔔 Notifications & Mute

- Push notifications delivered via **Firebase Cloud Messaging**, even when the tab is in the background, powered by a service worker
- A Cloud Function fires on every new message and notifies every room member who isn't currently looking at that room
- Per-room mute toggle (bell icon in the chat header) — muted rooms never push, but being **@mentioned overrides mute**
- Editing a message re-sends a notification, identical to a new message

---

### 🟢 Presence

- Live online indicator (green dot) on every avatar, driven by a heartbeat written every 30 seconds
- "Who's viewing this room" panel shows real-time avatars of everyone currently looking at the same channel
- Clicking any avatar — your own messages, reactions, or the viewers panel — opens that user's profile

---

### 🔢 Unread Counts

- Exact per-room unread badge in the sidebar (a real count, not just a dot)
- Increments live as messages arrive in rooms you're not viewing
- Clears itself automatically the moment a room is both selected **and** the browser tab is visible — no manual "mark as read"

---

### ⌨️ Typing Indicator

- "X is typing…" shown live to everyone else in the room while you type
- Debounced: writes at most once every 2 seconds during continuous typing
- Clears automatically after 3 seconds of inactivity, on blur, or right after sending

---

### ↩️ Reply

- Quote-reply to any message, including ones that were later deleted
- WhatsApp-style preview bar appears above the input while replying
- Clicking a quoted reply smooth-scrolls straight to the original message

---

### 🏷️ Mentions

- Type `@` to autocomplete room members — navigate with the mouse or the arrow keys + Enter
- Mentioned text is highlighted inline inside the message bubble, including for the mentioned user themself
- A mention notifies the tagged user even if they have the room muted

---

### 😄 Reactions

- Six emoji reactions on every message: 👍 ❤️ 😂 😮 😢 🙏
- Click to react, click again to remove — same toggle behavior as Slack/WhatsApp
- Hovering a reaction pill shows exactly who reacted

---

### ✏️ Edit & Delete Messages

- Edit or delete your own messages within a 15 minute window after sending
- Deleted messages show a placeholder in the UI — the original content stays in Firestore (soft delete)
- Editing a message re-triggers a push notification to the room

---

### 🎤 Voice Messages

- Record up to 2 minutes directly in the browser (auto-cuts at the limit) — the recording uploads and sends the instant you stop
- Playback with play/pause and a draggable seek bar to jump to any point in the message
- Elapsed recording time and the recorded message's duration both render with the same `M:SS` formatter

---

### 🤖 AI — Channel Summary & Smart Reply

Powered by **Claude Sonnet 4.6**, called exclusively from Cloud Functions — the API key never reaches the browser.

- **Channel Summary:** one click summarizes everything you missed in a room since you last opened it
- **Smart Reply:** suggests 2–3 short, contextual replies based on the recent conversation — send one as-is, or edit it before sending

---

### 📎 File Attachments

Send more than just text:

| Type                                                                  | Behavior                           |
| --------------------------------------------------------------------- | ---------------------------------- |
| Images (`jpg`, `png`, `gif`, `webp`, …)                               | Rendered inline in the chat bubble |
| Documents (`pdf`, `doc`, `docx`, `xls`, `xlsx`, `ppt`, `pptx`, `txt`) | Rendered as a titled download link |

- Max file size: **100 MB**
- Files are uploaded to **Firebase Storage** at `rooms/{roomId}/{timestamp}_{filename}`
- A live preview is shown in the input bar before sending
- Message document gains optional `fileURL`, `fileName`, and `fileType` fields

---

### 👤 User Profiles

- Edit display name and bio
- Upload a custom profile photo (stored in Firebase Storage)
- Changes sync in real time across all active sessions
- Consistent avatar display in chat messages, reactions, and the presence panel

---

### 📱 Responsive Layout

- Mobile first sidebar with tap-to-open overlay
- Fixed viewport layout: only the message list scrolls — header, sidebar, and input bar stay anchored
- RTL aware message bubbles (`dir="auto"`, applied per text node) for Hebrew and Arabic text

---

## 🛠 Technology Stack

### Frontend

| Technology                | Role                                                         |
| ------------------------- | ------------------------------------------------------------ |
| **Vite + React 19**       | Build tooling & component model                              |
| **React Router v7**       | Client-side SPA routing (`/`, `/login`, `/chat`, `/profile`) |
| **Tailwind CSS v4**       | Utility-first styling via `@tailwindcss/vite` plugin         |
| **Outfit (Google Fonts)** | Typography                                                   |

### Firebase

| Service                   | Usage                                                                      |
| ------------------------- | -------------------------------------------------------------------------- |
| **Cloud Firestore**       | Real-time messages, presence, typing, unread counts, mute state, reactions |
| **Firebase Auth**         | Email/password + Google Sign-In                                            |
| **Firebase Storage**      | Profile images, file attachments, voice messages                           |
| **Cloud Functions**       | Push fan-out (`onNewMessage`, `onMessageEdited`) and callable AI endpoints |
| **Cloud Messaging (FCM)** | Browser push notifications, delivered via a service worker                 |

### AI

| Technology            | Role                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Claude Sonnet 4.6** | Channel summaries (`summarizeUnread`) and smart reply suggestions (`suggestReplies`), called server-side only |

### Testing

| Tool                        | Role                                                                                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Vitest**                  | Test runner — one suite for the frontend, one for Cloud Functions                                                    |
| **Testing Library / React** | Component rendering & DOM queries                                                                                    |
| **jsdom**                   | Browser environment simulation (with manual mocks for `MediaRecorder`/`getUserMedia`, which jsdom doesn't implement) |

---

## 🗂 Project Structure

```
port0-chat/
├── public/
│   ├── favicon.svg, icons.svg
│   └── firebase-messaging-sw.js     # FCM background push handler
├── functions/                        # Firebase Cloud Functions (own package.json + Vitest suite)
│   ├── index.js                      # Function registration, auth/Claude-client helpers
│   ├── onNewMessage.js               # Push fan-out on new messages
│   ├── onMessageEdited.js            # Re-notify on message edit
│   ├── shouldSendPush.js             # Pure: mute / mention / self-send decision
│   ├── isViewingRoom.js              # Pure: shared "is the user looking at this room" check
│   ├── isMessageEdit.js              # Pure: distinguishes an edit from a soft-delete
│   ├── summarizeUnread.js            # Channel Summary (Claude)
│   ├── suggestReplies.js             # Smart Reply (Claude)
│   ├── formatMessageTranscript.js    # Shared transcript formatting for both AI functions
│   └── tests/
├── src/
│   ├── assets/                       # Port0 logo, SVGs
│   ├── contexts/
│   │   ├── AuthContext.jsx           # login, register, googleSignIn, logout
│   │   └── ChatContext.jsx           # selectedRoom state
│   ├── hooks/                        # Each hook owns one live subscription
│   │   ├── usePresence.js, useMutedRooms.js, useUnreadCounts.js
│   │   ├── useRoomViewers.js, useAllUsers.js, useForceRecheck.js
│   │   ├── useTypingWriter.js, useTypingUsers.js
│   │   └── useVoiceRecorder.js
│   ├── lib/                          # Pure functions, no Firebase imports
│   │   ├── formatDuration.js, dateSeparator.js
│   │   ├── isOnline.js, isTypingFresh.js
│   │   └── mentions.js, messageActionWindow.js
│   ├── components/
│   │   ├── Sidebar.jsx               # Room list, unread badges, logo
│   │   ├── ChatRoom.jsx              # Header (mute, summary) + MessageList + MessageInput
│   │   ├── MessageList.jsx           # Firestore subscription, auto-scroll, date separators
│   │   ├── MessageItem.jsx           # Bubble: edit/delete, reply, mentions, reactions, voice player
│   │   ├── MessageInput.jsx          # Text/file/voice input, mentions, typing, smart reply
│   │   ├── TypingIndicator.jsx, WhoIsViewing.jsx
│   │   ├── Avatar.jsx, ProfileModal.jsx
│   │   └── ProtectedRoute.jsx
│   ├── pages/
│   │   ├── SplashPage.jsx            # Animated SVG intro
│   │   ├── LoginPage.jsx             # Login / Register tabs + password strength
│   │   ├── ChatPage.jsx              # Sidebar + ChatRoom layout
│   │   └── ProfilePage.jsx           # Avatar upload, name & bio editor
│   ├── firebase.js                   # initializeApp → auth, db, storage, functions
│   ├── App.jsx                       # BrowserRouter + providers + routes
│   └── index.css                     # Outfit import + @import "tailwindcss"
├── tests/                            # Vitest suites for src/ (gitignored)
├── .env                               # Firebase config + VAPID key (gitignored)
├── index.html
├── vite.config.js
└── package.json
```

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────┐
│              React SPA (Vite)                │
│  AuthContext · ChatContext                    │
│  ChatPage → Sidebar + ChatRoom                │
│  (MessageList, MessageInput, WhoIsViewing,    │
│   TypingIndicator, Summary/Smart-Reply UI)    │
└──────────────┬─────────────────┬──────────────┘
               │                 │
               ▼                 ▼
       Firebase Auth      Cloud Firestore
      (email / Google)   (messages, users,
                           presence, typing,
                           unread, reactions)
                                 │
            ┌────────────────────┼────────────────────┐
            ▼                    ▼                    ▼
    Firebase Storage     Firestore Triggers      httpsCallable
   (files, voice notes,   onNewMessage,         summarizeUnread,
       avatars)           onMessageEdited       suggestReplies
                                 │                    │
                                 ▼                    ▼
                       Firebase Cloud Messaging  Anthropic Claude API
                          (push notifications)     (Sonnet 4.6)
```

**State model:** Two React contexts carry cross-cutting state — `AuthContext` for identity, `ChatContext` for the selected room. Everything else live (presence, typing, unread counts, muted rooms, room viewers, recording state) is owned by a dedicated custom hook that subscribes directly to Firestore or the browser, scoped to exactly the component that needs it — not pushed into global context.

**Security:** Firestore rules enforce `request.auth != null` on all reads and writes — unauthenticated access is blocked at the database level. The Anthropic API key is stored only as a Firebase Functions secret; Claude is called exclusively from Cloud Functions, never from the browser.

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18
- A Firebase project on the **Blaze (pay-as-you-go)** plan — required for Cloud Functions and Cloud Messaging
- An [Anthropic API key](https://console.anthropic.com) — for Channel Summary & Smart Reply

### 1. Clone & install

```bash
git clone https://github.com/Itamar-Hadad/port0-chat.git
cd port0-chat
npm install
cd functions && npm install && cd ..
```

### 2. Configure Firebase (frontend)

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_VAPID_KEY=...
```

### 3. Configure push notifications

- Firebase Console → **Project Settings → Cloud Messaging** → generate a **Web Push certificate** (VAPID key pair) → copy it into `VITE_FIREBASE_VAPID_KEY`
- Service workers can't read `.env` — copy the same `firebaseConfig` values directly into `public/firebase-messaging-sw.js`

### 4. Configure the Anthropic API key

```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
```

Paste the key from console.anthropic.com when prompted. (If the Firebase CLI isn't installed globally, run any `firebase` command as `npx firebase-tools` instead.)

### 5. Enable Firebase services

In the Firebase console:

- **Authentication** → enable Email/Password and Google providers
- **Firestore** → create database, set rules to `allow read, write: if request.auth != null`
- **Storage** → enable with default rules
- **Cloud Messaging** → enable (used for push notifications)

### 6. Deploy Cloud Functions

```bash
firebase deploy --only functions
```

### 7. Run locally

```bash
npm run dev
```

### 8. Run tests

```bash
npx vitest run                      # frontend
cd functions && npx vitest run      # Cloud Functions
```

---

## 📸 Screenshots

### Splash & Authentication

<p align="center">
  <img src="screenshots/splash.png" width="500"/>
  <img src="screenshots/login.png" width="500"/>
  <img src="screenshots/register.png" width="500"/>
</p>
<p align="center">
  <sub>Splash Screen</sub> &nbsp;•&nbsp; <sub>Login</sub> &nbsp;•&nbsp; <sub>Register with Password Strength</sub>
</p>

---

### Chat Experience

<p align="center">
  <img src="screenshots/chat.png" width="600"/>
</p>
<p align="center">
  <sub>Real-Time Chat Room</sub>
</p>

---

### User Profile

<p align="center">
  <img src="screenshots/profile.png" width="600"/>
</p>
<p align="center">
  <sub>Profile Editor</sub>
</p>

---

## 🔮 Potential Enhancements

- Full threaded conversations (beyond the current quote-reply)
- Message search and paginated history (rooms currently load their full message history)
- Direct messages between individual users (today, all rooms are public channels)
- Read receipts — who has seen a specific message, not just who's viewing the room
- Localization / multi-language UI

---

## 👤 Author

**Itamar Hadad**

📧 [hzitamar4@gmail.com](mailto:hzitamar4@gmail.com)  
🔗 [linkedin.com/in/itamar-hadad](https://www.linkedin.com/in/itamar-hadad-1aa946307/)

---

<p align="center">
  Styled to match <a href="https://port0.io">port0.io</a>
</p>
