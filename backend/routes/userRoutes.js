const express = require('express');
const router = express.Router();
const { User } = require('../models');

// Helper: Calculate Jaccard Similarity Match Score (BACKEND.md Q10)
function calculateMatchScore(userA, userB) {
  const interestsA = new Set(userA.interests || []);
  const interestsB = new Set(userB.interests || []);

  if (interestsA.size === 0 && interestsB.size === 0) return 50;

  let commonCount = 0;
  for (const item of interestsA) {
    if (interestsB.has(item)) commonCount++;
  }

  const unionSize = new Set([...interestsA, ...interestsB]).size;
  let score = unionSize === 0 ? 50 : Math.round((commonCount / unionSize) * 100);

  if (userA.city && userB.city && userA.city.toLowerCase() === userB.city.toLowerCase()) {
    score = Math.min(100, score + 10);
  }

  return Math.max(25, score);
}

// GET /api/users (used by frontend fetchUsers)
router.get('/', async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: -1 });
    const onlineUsers = users.filter(u => u.online || u.isOnline).map(u => u.customId || u._id.toString());
    res.json({
      users,
      onlineUserIds: onlineUsers
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/discover
router.get('/discover', async (req, res) => {
  try {
    const { currentUserId, city } = req.query;
    let currentUser = null;

    if (currentUserId) {
      currentUser = await User.findOne({ $or: [{ customId: currentUserId }, { _id: currentUserId }] });
    }

    const query = currentUser ? { _id: { $ne: currentUser._id } } : {};
    if (city) query.city = new RegExp(city, 'i');

    const users = await User.find(query).limit(50);

    const scoredUsers = users.map((u) => {
      const matchScore = currentUser ? calculateMatchScore(currentUser, u) : 80;
      return {
        ...u.toObject(),
        matchScore
      };
    });

    res.json({ success: true, count: scoredUsers.length, users: scoredUsers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/users/profile/:id (with Private Album Privacy Check)
router.get('/profile/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.query.requesterId;

    const user = await User.findOne({ $or: [{ customId: id }, { _id: id }] });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const userObj = user.toObject();

    const isOwner = requesterId && (String(requesterId) === String(user.customId) || String(requesterId) === String(user._id));
    const isApproved = requesterId && user.approvedViewers && user.approvedViewers.some((viewerId) => String(viewerId) === String(requesterId));

    if (!isOwner && !isApproved) {
      userObj.privateAlbum = [];
      userObj.isPrivateAlbumLocked = true;
    } else {
      userObj.isPrivateAlbumLocked = false;
    }

    res.json({ success: true, user: userObj });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/update-profile (or /api/users/profile)
router.post('/update-profile', async (req, res) => {
  try {
    const body = req.body;
    const identifier = body.id || body._id;

    let user = await User.findOne({
      $or: [
        { customId: String(identifier) },
        { _id: mongoose.Types.ObjectId.isValid(identifier) ? identifier : new mongoose.Types.ObjectId() },
        { email: body.email?.toLowerCase() }
      ]
    });

    if (!user) {
      user = new User({
        customId: String(identifier || Date.now()),
        ...body,
        isProfileComplete: true
      });
      await user.save();
    } else {
      Object.assign(user, body, { isProfileComplete: true });
      await user.save();
    }

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/album/approve
router.post('/album/approve', async (req, res) => {
  try {
    const { ownerId, viewerId } = req.body;
    await User.findOneAndUpdate(
      { $or: [{ customId: ownerId }, { _id: ownerId }] },
      { $addToSet: { approvedViewers: viewerId } }
    );
    res.json({ success: true, message: 'Private album access granted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/sync-demo
router.post('/sync-demo', async (req, res) => {
  try {
    const { demoUsers } = req.body;
    if (Array.isArray(demoUsers)) {
      for (const du of demoUsers) {
        const exists = await User.findOne({ $or: [{ customId: String(du.id) }, { email: du.email?.toLowerCase() }] });
        if (!exists) {
          await User.create({
            customId: String(du.id),
            name: du.name,
            email: du.email,
            password: du.password || 'demo123',
            age: du.age,
            gender: du.gender,
            preference: du.preference,
            area: du.area,
            city: du.city,
            bio: du.bio,
            interests: du.interests,
            avatar: du.image,
            image: du.image,
            album: du.album,
            isPremium: du.isPremium
          });
        }
      }
    }
    const all = await User.find({});
    res.json({ users: all });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/clear-demo
router.post('/clear-demo', async (req, res) => {
  try {
    // Delete users with id 1 to 10
    await User.deleteMany({ customId: { $in: ['1','2','3','4','5','6','7','8','9','10'] } });
    const remaining = await User.find({});
    res.json({ users: remaining });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
