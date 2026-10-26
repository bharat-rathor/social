// ============================================================
// SOCIAL CONNECT — Local Real-Time Server Plugin for Vite
// Enables shared database & real-time WebSocket communication
// across multiple laptops on the same Wi-Fi network (0.0.0.0).
// ============================================================
import fs from 'fs';
import path from 'path';
import http from 'http';

export function socialServerPlugin() {
  const dataFilePath = path.resolve(process.cwd(), 'server-data.json');

  // Load or initialize server data
  function loadData() {
    try {
      if (fs.existsSync(dataFilePath)) {
        const raw = fs.readFileSync(dataFilePath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error reading server-data.json:', e);
    }
    return {
      users: [],
      messages: [],
      likes: {},
      favorites: {},
      views: {},
      reports: []
    };
  }

  function saveData(data) {
    try {
      fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error('Error saving server-data.json:', e);
    }
  }

  // Active online user tracking by socket id
  const socketToUser = new Map(); // socket -> userId
  const onlineUsers = new Set();  // Set of userIds

  return {
    name: 'social-realtime-server',
    configureServer(server) {
      console.log('🚀 [Social Server] Initializing Localhost & Wi-Fi Real-Time API Engine...');

      // Broadcast presence to all connected devices
      function broadcastPresence() {
        const activeIds = Array.from(onlineUsers);
        server.ws.send({
          type: 'custom',
          event: 'social:presence',
          data: { onlineUserIds: activeIds }
        });
      }

      // Handle custom WebSocket events from clients (both localhost & network IP)
      server.ws.on('social:auth', (data, client) => {
        if (data?.userId) {
          const uid = String(data.userId);
          socketToUser.set(client, uid);
          onlineUsers.add(uid);
          console.log(`🟢 [Social Server] User ${uid} connected from client. Total online: ${onlineUsers.size}`);
          broadcastPresence();
        }
      });

      server.ws.on('social:send-message', (data, client) => {
        if (data?.message) {
          const db = loadData();
          db.messages.push(data.message);
          saveData(db);

          // Broadcast new message to all connected clients
          server.ws.send({
            type: 'custom',
            event: 'social:new-message',
            data: { message: data.message }
          });
        }
      });

      server.ws.on('social:typing', (data, client) => {
        if (data?.senderId && data?.receiverId) {
          server.ws.send({
            type: 'custom',
            event: 'social:typing',
            data
          });
        }
      });

      // Real-Time WebRTC Calling Signals & Lifecycle
      server.ws.on('social:call-request', (data, client) => {
        if (data?.callerId && data?.receiverId) {
          console.log(`📞 [Social Server] Call request from ${data.callerName} (${data.callerId}) to user ${data.receiverId} [Type: ${data.callType}]`);
          server.ws.send({
            type: 'custom',
            event: 'social:call-request',
            data
          });
        }
      });

      server.ws.on('social:call-accepted', (data, client) => {
        if (data?.callId) {
          console.log(`✅ [Social Server] Call ${data.callId} accepted by user ${data.receiverId}`);
          server.ws.send({
            type: 'custom',
            event: 'social:call-accepted',
            data
          });
        }
      });

      server.ws.on('social:call-rejected', (data, client) => {
        if (data?.callId) {
          console.log(`❌ [Social Server] Call ${data.callId} rejected by user ${data.receiverId}`);
          server.ws.send({
            type: 'custom',
            event: 'social:call-rejected',
            data
          });
        }
      });

      server.ws.on('social:call-ended', (data, client) => {
        if (data?.callId) {
          console.log(`📴 [Social Server] Call ${data.callId} ended`);
          server.ws.send({
            type: 'custom',
            event: 'social:call-ended',
            data
          });
        }
      });

      server.ws.on('social:call-signal', (data, client) => {
        if (data?.callId && data?.signal) {
          server.ws.send({
            type: 'custom',
            event: 'social:call-signal',
            data
          });
        }
      });

      // Handle client disconnect
      server.ws.on('connection', (socket) => {
        socket.on('close', () => {
          const uid = socketToUser.get(socket);
          if (uid) {
            socketToUser.delete(socket);
            // Check if user has other tabs open
            const stillActive = Array.from(socketToUser.values()).includes(uid);
            if (!stillActive) {
              onlineUsers.delete(uid);
              console.log(`🔌 [Social Server] User ${uid} disconnected. Total online: ${onlineUsers.size}`);
              broadcastPresence();
            }
          }
        });
      });

      // Connection bridge to Production Express + MongoDB Backend (port 5000)
      let backendActive = false;
      let lastCheck = 0;

      async function isBackendRunning() {
        const now = Date.now();
        if (now - lastCheck < 3000) return backendActive;
        lastCheck = now;
        try {
          const res = await fetch('http://127.0.0.1:5000/', { signal: AbortSignal.timeout(200) });
          backendActive = res.ok;
          if (backendActive) {
            console.log('🍃 [Social Server Bridge] Connected to Production Backend on port 5000 (MongoDB Atlas)!');
          }
        } catch {
          backendActive = false;
        }
        return backendActive;
      }

      // API Endpoints middleware
      server.middlewares.use(async (req, res, next) => {
        const url = req.url.split('?')[0];

        // Check if backend on port 5000 is running
        if (url.startsWith('/api')) {
          const running = await isBackendRunning();
          if (running) {
            const proxyReq = http.request({
              hostname: '127.0.0.1',
              port: 5000,
              path: req.url,
              method: req.method,
              headers: {
                ...req.headers,
                host: '127.0.0.1:5000'
              }
            }, (proxyRes) => {
              res.writeHead(proxyRes.statusCode, proxyRes.headers);
              proxyRes.pipe(res);
            });

            proxyReq.on('error', () => {
              handleLocalApi(req, res, next, url);
            });

            req.pipe(proxyReq);
            return;
          }
        }

        handleLocalApi(req, res, next, url);
      });

      function handleLocalApi(req, res, next, url) {

        // Helper to parse JSON body
        function parseBody(callback) {
          let body = '';
          req.on('data', chunk => { body += chunk; });
          req.on('end', () => {
            try {
              callback(body ? JSON.parse(body) : {});
            } catch (err) {
              res.statusCode = 400;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Invalid JSON' }));
            }
          });
        }

        function jsonResponse(data, status = 200) {
          res.statusCode = status;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify(data));
        }

        // GET /api/users
        if (req.method === 'GET' && url === '/api/users') {
          const db = loadData();
          return jsonResponse({
            users: db.users,
            onlineUserIds: Array.from(onlineUsers)
          });
        }

        // POST /api/register
        if (req.method === 'POST' && url === '/api/register') {
          return parseBody((body) => {
            const db = loadData();
            const { name, email, password, image } = body;
            const emailLower = (email || '').toLowerCase().trim();

            if (db.users.some(u => u.email?.toLowerCase() === emailLower)) {
              return jsonResponse({ error: 'An account with this email already exists.' }, 400);
            }

            const newUser = {
              id: Date.now(),
              name: (name || '').trim(),
              email: emailLower,
              password,
              age: body.age || null,
              gender: body.gender || null,
              preference: body.preference || null,
              area: body.area || '',
              city: body.city || '',
              bio: body.bio || '',
              interests: body.interests || [],
              image: image || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
              album: [],
              online: true,
              lastSeen: null,
              isPremium: false,
              isProfileComplete: false,
              createdAt: new Date().toISOString()
            };

            db.users.push(newUser);
            saveData(db);

            console.log(`✨ [Social Server] New account created: ${newUser.name} (${newUser.email}) - ID: ${newUser.id}`);

            // Notify all other clients on Wi-Fi that a new user joined!
            server.ws.send({
              type: 'custom',
              event: 'social:user-registered',
              data: { user: newUser }
            });

            return jsonResponse({ user: newUser });
          });
        }

        // POST /api/login
        if (req.method === 'POST' && url === '/api/login') {
          return parseBody((body) => {
            const db = loadData();
            const emailLower = (body.email || '').toLowerCase().trim();
            const user = db.users.find(u => u.email?.toLowerCase() === emailLower && u.password === body.password);

            if (!user) {
              return jsonResponse({ error: 'Invalid email or password.' }, 401);
            }

            return jsonResponse({ user });
          });
        }

        // POST /api/update-profile
        if (req.method === 'POST' && url === '/api/update-profile') {
          return parseBody((body) => {
            const db = loadData();
            const idx = db.users.findIndex(u =>
              String(u.id) === String(body.id) ||
              (body.email && u.email?.toLowerCase() === body.email?.toLowerCase())
            );

            if (idx === -1) {
              const newUserObj = { ...body, isProfileComplete: true };
              db.users.push(newUserObj);
              saveData(db);
              console.log(`✅ [Social Server] Profile upserted on server: ${newUserObj.name} (ID: ${newUserObj.id})`);
              server.ws.send({
                type: 'custom',
                event: 'social:user-updated',
                data: { user: newUserObj }
              });
              return jsonResponse({ user: newUserObj });
            }

            db.users[idx] = { ...db.users[idx], ...body, isProfileComplete: true };
            saveData(db);
            console.log(`✅ [Social Server] Profile updated on server: ${db.users[idx].name} (ID: ${db.users[idx].id})`);

            server.ws.send({
              type: 'custom',
              event: 'social:user-updated',
              data: { user: db.users[idx] }
            });

            return jsonResponse({ user: db.users[idx] });
          });
        }

        // GET /api/messages
        if (req.method === 'GET' && url === '/api/messages') {
          const db = loadData();
          return jsonResponse({ messages: db.messages });
        }

        // POST /api/messages
        if (req.method === 'POST' && url === '/api/messages') {
          return parseBody((body) => {
            const db = loadData();
            const newMsg = body.message;
            if (!newMsg || !newMsg.id) {
              return jsonResponse({ error: 'Invalid message object' }, 400);
            }

            db.messages.push(newMsg);
            saveData(db);

            // Broadcast message in real-time
            server.ws.send({
              type: 'custom',
              event: 'social:new-message',
              data: { message: newMsg }
            });

            return jsonResponse({ success: true, message: newMsg });
          });
        }

        // POST /api/messages/read
        if (req.method === 'POST' && url === '/api/messages/read') {
          return parseBody(({ userId, partnerId }) => {
            const db = loadData();
            db.messages = db.messages.map(m =>
              m.senderId === partnerId && m.receiverId === userId ? { ...m, seen: true } : m
            );
            saveData(db);

            server.ws.send({
              type: 'custom',
              event: 'social:messages-read',
              data: { userId, partnerId }
            });

            return jsonResponse({ success: true });
          });
        }

        // POST /api/sync-demo
        if (req.method === 'POST' && url === '/api/sync-demo') {
          return parseBody(({ demoUsers }) => {
            const db = loadData();
            if (Array.isArray(demoUsers)) {
              demoUsers.forEach(du => {
                if (!db.users.some(u => u.id === du.id)) {
                  db.users.push({ ...du, online: false });
                }
              });
              saveData(db);
            }
            return jsonResponse({ users: db.users });
          });
        }

        // POST /api/clear-demo
        if (req.method === 'POST' && url === '/api/clear-demo') {
          const db = loadData();
          // Keep only user-created accounts (id > 100)
          db.users = db.users.filter(u => u.id > 100 || String(u.id).length > 5);
          saveData(db);

          server.ws.send({
            type: 'custom',
            event: 'social:users-cleared',
            data: { users: db.users }
          });

          return jsonResponse({ users: db.users });
        }

        next();
      }
    }
  };
}
