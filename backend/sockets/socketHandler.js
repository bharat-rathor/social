const { Message, CallLog, User } = require('../models');
const redisClient = require('../config/redis');

module.exports = function (io) {
  io.on('connection', (socket) => {
    const userId = socket.handshake.auth?.userId || socket.handshake.query?.userId;

    if (userId) {
      socket.userId = userId;
      // 1. Join user to their private dedicated routing room
      socket.join(`room_user_${userId}`);
      
      // 2. Track presence in Redis
      redisClient.set(`user:${userId}:socket`, socket.id);
      redisClient.set(`user:${userId}:online`, 'true');

      // Update user status in DB
      User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() }).catch(() => {});

      // Broadcast presence update
      io.emit('user_status_changed', { userId, isOnline: true });
      console.log(`🟢 [Socket] User ${userId} connected on socket ${socket.id}`);
    }

    // --- INSTANT MESSAGING & DELIVERY RECEIPTS (Sent, Delivered, Read) ---
    socket.on('send_message', async ({ receiverId, text, mediaUrl, messageType = 'text', tempId }, callback) => {
      try {
        if (!socket.userId) return;

        const chatId = [String(socket.userId), String(receiverId)].sort().join('_');

        // Check if receiver is online to determine initial delivery status
        const isReceiverOnline = await redisClient.get(`user:${receiverId}:online`);
        const initialStatus = isReceiverOnline ? 'delivered' : 'sent';

        // 1. Persist message in MongoDB
        const newMsg = await Message.create({
          chatId,
          sender: socket.userId,
          receiver: receiverId,
          text: text || '',
          mediaUrl: mediaUrl || null,
          messageType,
          status: initialStatus
        });

        // 2. Route directly to receiver's private room
        io.to(`room_user_${receiverId}`).emit('receive_message', newMsg);

        // 3. Acknowledge sender with confirmed saved ID
        if (typeof callback === 'function') {
          callback({ success: true, message: newMsg, tempId });
        }
        socket.emit('message_status_update', { messageId: newMsg._id, status: initialStatus });
      } catch (err) {
        console.error('Error in send_message:', err);
        if (typeof callback === 'function') callback({ success: false, error: err.message });
      }
    });

    // Mark messages as read (Blue Tick ✓✓)
    socket.on('mark_read', async ({ partnerId }) => {
      try {
        if (!socket.userId) return;

        const chatId = [String(socket.userId), String(partnerId)].sort().join('_');
        const now = new Date();

        await Message.updateMany(
          { chatId, receiver: socket.userId, status: { $ne: 'read' } },
          { $set: { status: 'read', readAt: now } }
        );

        // Notify sender that their messages were read
        io.to(`room_user_${partnerId}`).emit('messages_read', {
          byUserId: socket.userId,
          chatId,
          readAt: now
        });
      } catch (err) {
        console.error('Error in mark_read:', err);
      }
    });

    // Typing Indicators
    socket.on('typing', ({ receiverId, isTyping }) => {
      io.to(`room_user_${receiverId}`).emit('partner_typing', {
        userId: socket.userId,
        isTyping
      });
    });

    // --- WebRTC VIDEO & AUDIO CALL SIGNALING ENGINE ---
    socket.on('call_user', ({ receiverId, callType, offerSignal }) => {
      io.to(`room_user_${receiverId}`).emit('incoming_call', {
        callerId: socket.userId,
        callType: callType || 'video',
        offerSignal
      });
    });

    socket.on('accept_call', ({ callerId, answerSignal }) => {
      io.to(`room_user_${callerId}`).emit('call_accepted', {
        receiverId: socket.userId,
        answerSignal
      });
    });

    socket.on('reject_call', async ({ callerId, callType }) => {
      io.to(`room_user_${callerId}`).emit('call_rejected', {
        byUserId: socket.userId
      });

      // Save call log as rejected
      try {
        await CallLog.create({
          caller: callerId,
          receiver: socket.userId,
          callType: callType || 'video',
          status: 'rejected',
          durationSeconds: 0
        });
      } catch (e) {}
    });

    socket.on('ice_candidate', ({ targetUserId, candidate }) => {
      io.to(`room_user_${targetUserId}`).emit('ice_candidate', {
        fromUserId: socket.userId,
        candidate
      });
    });

    socket.on('end_call', async ({ partnerId, callType, durationSeconds }) => {
      io.to(`room_user_${partnerId}`).emit('call_ended');

      // Persist completed Call Log to MongoDB
      try {
        await CallLog.create({
          caller: socket.userId,
          receiver: partnerId,
          callType: callType || 'video',
          status: 'connected',
          endedAt: new Date(),
          durationSeconds: durationSeconds || 0
        });
      } catch (e) {}
    });

    // --- DISCONNECT ---
    socket.on('disconnect', async () => {
      if (socket.userId) {
        await redisClient.del(`user:${socket.userId}:socket`);
        await redisClient.set(`user:${socket.userId}:online`, 'false');

        const now = new Date();
        await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: now }).catch(() => {});

        io.emit('user_status_changed', { userId: socket.userId, isOnline: false, lastSeen: now });
        console.log(`🔴 [Socket] User ${socket.userId} disconnected`);
      }
    });
  });
};
