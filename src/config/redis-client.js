
const { createClient } = require("redis");

const redisClient = createClient({ url: "redis://redis:6379" });

redisClient.on('error', (err) => console.error('!!! Redis Client Error', err));
redisClient.on('connect', () => console.log('✅ Redis client connected'));
redisClient.on('ready', () => console.log('Redis client is ready to use'));
redisClient.on('end', () => console.log('Redis client disconnected'));

(async () => {
    await redisClient.connect();
})();


module.exports = redisClient;