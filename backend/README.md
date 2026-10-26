# 🍃 Social Connect — Production Backend & Database Architecture

This directory contains the production-grade **Node.js + Express + MongoDB (Mongoose) + Redis + Socket.io** implementation described in [`../BACKEND.md`](../BACKEND.md).

---

## 🗄️ Database Schemas Architecture

### 1. `User` Schema ([`models/User.js`](./models/User.js))
- **Authentication**: `email` (unique index), `password` (hashed with `bcryptjs`, `select: false`).
- **Profile**: `name`, `age`, `gender`, `city` (indexed), `bio`, `avatar`.
- **Matchmaking**: `interests` (indexed array for Jaccard Similarity Match Score calculations).
- **Privacy & Security**:
  - `album`: Public photo CDN URLs.
  - `privateAlbum`: Locked photo URLs.
  - `approvedViewers`: Array of User IDs permitted to view locked photos.
- **Subscription**: `plan` (`free`, `standard`, `vip_gold`), `isPremium`, `expiryDate`.
- **Social Graph**: `likesSent`, `likesReceived`, `blockedUsers`.
- **Presence**: `isOnline`, `lastSeen`.

### 2. `Message` Schema ([`models/Message.js`](./models/Message.js))
- `chatId`: Indexed conversation room ID (`userA_userB` sorted).
- `sender` & `receiver`: User ObjectIds with indexes.
- `text`, `mediaUrl`, `messageType`: (`text`, `image`, `audio`, `call_record`).
- **Delivery Receipts**: `status` (`'sent'`, `'delivered'`, `'read'`), `readAt`.
- **Optimization**: Compound index `{ chatId: 1, createdAt: -1 }` for instant infinite-scroll pagination.

### 3. `CallLog` Schema ([`models/CallLog.js`](./models/CallLog.js))
- `caller` & `receiver`: User ObjectIds.
- `callType`: (`'audio'`, `'video'`).
- `status`: (`'missed'`, `'rejected'`, `'connected'`, `'busy'`).
- `startedAt`, `endedAt`, `durationSeconds`.

### 4. Redis Cache ([`config/redis.js`](./config/redis.js))
- User presence tracking (`user:<id>:online`).
- Active socket routing (`user:<id>:socket`).
- Ephemeral typing states with auto-expiring TTL.

---

## 🚀 Setup & Execution

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Update `MONGO_URI` with your MongoDB Atlas connection string.

### 3. Start the Server
```bash
npm run dev   # Development with auto-reload
# or
npm start     # Production
```
