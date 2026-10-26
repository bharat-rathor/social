const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/social_connect';
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true,
    });
    console.log(`🍃 [MongoDB Atlas] Connected successfully: ${conn.connection.host}`);

    // Check if initial seeding is needed
    const User = require('../models/User');
    const Message = require('../models/Message');

    const count = await User.countDocuments();
    if (count === 0) {
      console.log('📦 [Database Seed] Empty database detected. Seeding from server-data.json...');
      const seedPath = path.resolve(__dirname, '../../myapp/server-data.json');
      if (fs.existsSync(seedPath)) {
        const raw = fs.readFileSync(seedPath, 'utf8');
        const data = JSON.parse(raw);

        if (Array.isArray(data.users) && data.users.length > 0) {
          const userDocs = data.users.map((u) => ({
            customId: String(u.id),
            name: u.name,
            email: u.email,
            password: u.password,
            age: u.age,
            gender: u.gender,
            preference: u.preference || 'All',
            area: u.area || '',
            city: u.city || '',
            bio: u.bio || '',
            interests: u.interests || [],
            avatar: u.image || u.avatar,
            image: u.image || u.avatar,
            album: u.album || [],
            privateAlbum: u.privateAlbum || [],
            approvedViewers: u.approvedViewers || [],
            isPremium: !!u.isPremium,
            online: !!u.online,
            isOnline: !!u.online,
            lastSeen: u.lastSeen ? new Date(u.lastSeen) : new Date(),
            createdAt: u.createdAt ? new Date(u.createdAt) : new Date()
          }));
          await User.insertMany(userDocs);
          console.log(`✅ [Database Seed] Seeded ${userDocs.length} users into MongoDB.`);
        }

        if (Array.isArray(data.messages) && data.messages.length > 0) {
          const messageDocs = data.messages.map((m) => {
            const chatId = [String(m.senderId), String(m.receiverId)].sort().join('_');
            return {
              customId: String(m.id),
              chatId,
              senderId: m.senderId,
              receiverId: m.receiverId,
              text: m.message,
              message: m.message,
              image: m.image,
              mediaUrl: m.image,
              timestamp: m.timestamp || new Date().toISOString(),
              status: m.status || 'sent',
              seen: !!m.seen,
              readAt: m.seen ? new Date() : null,
              createdAt: m.timestamp ? new Date(m.timestamp) : new Date()
            };
          });
          await Message.insertMany(messageDocs);
          console.log(`✅ [Database Seed] Seeded ${messageDocs.length} messages into MongoDB.`);
        }
      }
    }
  } catch (error) {
    console.error('❌ [MongoDB Atlas] Connection Error:', error.message);
  }
};

module.exports = connectDB;
