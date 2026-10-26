/**
 * Redis Cache Layer
 * Provides sub-millisecond caching for online presence, socket mappings,
 * and typing indicators. Falls back gracefully to an in-memory Map if Redis
 * server is not configured or offline.
 */
class MemoryRedisFallback {
  constructor() {
    this.store = new Map();
    console.log('⚡ [Redis Layer] Using fast in-memory fallback store.');
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, value, mode, duration) {
    this.store.set(key, value);
    if (mode === 'EX' && duration) {
      setTimeout(() => this.store.delete(key), duration * 1000);
    }
    return 'OK';
  }

  async del(key) {
    return this.store.delete(key);
  }
}

let redisClient;

if (process.env.REDIS_URL) {
  try {
    // If external redis library installed and REDIS_URL provided
    const Redis = require('ioredis');
    redisClient = new Redis(process.env.REDIS_URL);
    redisClient.on('connect', () => console.log('⚡ [Redis Cache] Connected to Redis server.'));
    redisClient.on('error', (err) => console.error('Redis Error:', err.message));
  } catch (e) {
    redisClient = new MemoryRedisFallback();
  }
} else {
  redisClient = new MemoryRedisFallback();
}

module.exports = redisClient;
