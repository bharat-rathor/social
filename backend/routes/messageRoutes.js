const express = require('express');
const router = express.Router();
const { Message } = require('../models');

// GET /api/messages (All messages for frontend chat initialization)
router.get('/', async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ createdAt: 1 });
    res.json({ messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/messages/:partnerId (Paginated messages for infinite scroll)
router.get('/:partnerId', async (req, res) => {
  try {
    const { partnerId } = req.params;
    const currentUserId = req.query.currentUserId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;

    if (!currentUserId || !partnerId) {
      return res.status(400).json({ success: false, message: 'currentUserId and partnerId are required' });
    }

    const chatId = [String(currentUserId), String(partnerId)].sort().join('_');

    const messages = await Message.find({ chatId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({
      success: true,
      page,
      count: messages.length,
      messages: messages.reverse()
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/messages (Save message from frontend)
router.post('/', async (req, res) => {
  try {
    const msgData = req.body.message || req.body;
    if (!msgData || (!msgData.message && !msgData.text && !msgData.image && !msgData.mediaUrl)) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const sId = msgData.senderId || msgData.sender;
    const rId = msgData.receiverId || msgData.receiver;
    const chatId = [String(sId), String(rId)].sort().join('_');

    const newMsg = await Message.create({
      customId: msgData.id || `msg_${Date.now()}`,
      chatId,
      senderId: sId,
      receiverId: rId,
      sender: sId,
      receiver: rId,
      message: msgData.message || msgData.text || '',
      text: msgData.text || msgData.message || '',
      image: msgData.image || msgData.mediaUrl || null,
      mediaUrl: msgData.mediaUrl || msgData.image || null,
      timestamp: msgData.timestamp || new Date().toISOString(),
      status: msgData.status || 'sent',
      seen: !!msgData.seen
    });

    res.json({ success: true, message: newMsg });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages/read or /api/messages/mark-read
router.post(['/read', '/mark-read'], async (req, res) => {
  try {
    const { userId, partnerId, currentUserId } = req.body;
    const uId = userId || currentUserId;
    const pId = partnerId;

    if (!uId || !pId) {
      return res.status(400).json({ error: 'userId and partnerId are required' });
    }

    const chatId = [String(uId), String(pId)].sort().join('_');

    await Message.updateMany(
      {
        chatId,
        $or: [{ receiverId: uId }, { receiver: uId }],
        seen: { $ne: true }
      },
      {
        $set: {
          seen: true,
          status: 'read',
          readAt: new Date()
        }
      }
    );

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
