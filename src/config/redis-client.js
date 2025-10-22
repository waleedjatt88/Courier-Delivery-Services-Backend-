const { createClient } = require("redis");

const redisClient = createClient({
    url: "redis://redis:6379",
    socket: {
        connectTimeout: 10000, 
                reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error('!!! Redis: Too many reconnection attempts. Giving up.');
                return new Error('Too many reconnection attempts.');
            }
            return Math.min(retries * 100, 3000); 
        }
    }
});
redisClient.on('error', (err) => console.error('!!! Redis Client Error', err));
redisClient.on('connect', () => console.log('Connecting to Redis...'));
redisClient.on('ready', () => console.log('✅ Redis client is ready to use'));
redisClient.on('end', () => console.log('Redis client connection closed'));
redisClient.connect().catch((err) => {
    console.error('Initial Redis connection failed, reconnecting in background...', err.message);
});

module.exports = redisClient;


