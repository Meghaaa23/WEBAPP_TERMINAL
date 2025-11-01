
import Redis from "ioredis";

const redis = new Redis({
  host: "redis-11362.c326.us-east-1-3.ec2.redns.redis-cloud.com",
  port: 11362,
  username: "default",
  password: "2RPcmhqbUcSKQS7XMWJj5x6qxfgri5mV",
  tls: {}
});

redis.on("connect", () => console.log("Connected to Redis Cloud"));
redis.on("error", (err) => console.error("Redis Error:", err));


async function getOrCreateUser(sessionId, hostRole) {
  let username = await redis.get(`session:${sessionId}`);
  if (username) return username;

  username = "student" + Math.floor(Math.random() * 10000);

  await redis.set(`session:${sessionId}`, username);
  await redis.expire(`session:${sessionId}`, 86400); 

  await redis.hset(`user:${username}:meta`, {
    created_at: new Date().toISOString(),
    server: hostRole,
  });

  await redis.sadd("active_users", username);

  console.log(` Created new user ${username} for session ${sessionId}`);
  return username;
}

async function recordHistory(username, command) {
  await redis.lpush(`history:${username}`, command);
  await redis.ltrim(`history:${username}`, 0, 99);
}

async function getUserHistory(username, limit = 10) {
  return await redis.lrange(`history:${username}`, 0, limit - 1);
}

export { redis, getOrCreateUser, recordHistory, getUserHistory };
