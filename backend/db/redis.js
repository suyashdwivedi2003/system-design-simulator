import { createClient } from "redis";

// ── Debug: print all env vars related to Redis ───────────────────
console.log("🔍 REDIS DEBUG:");
console.log("   REDIS_URL:",     process.env.REDIS_URL     ? "SET (" + process.env.REDIS_URL.substring(0, 20) + "...)" : "NOT SET");
console.log("   REDIS_HOST:",    process.env.REDIS_HOST    || "NOT SET");
console.log("   REDIS_PORT:",    process.env.REDIS_PORT    || "NOT SET");
console.log("   REDISHOST:",     process.env.REDISHOST     || "NOT SET");
console.log("   REDISPORT:",     process.env.REDISPORT     || "NOT SET");
console.log("   REDISPASSWORD:", process.env.REDISPASSWORD ? "SET" : "NOT SET");
console.log("   REDISUSER:",     process.env.REDISUSER     || "NOT SET");

// ── Build config from available env vars ─────────────────────────
function getRedisConfig() {
  // If REDIS_URL is set and contains password → use it directly
  if (process.env.REDIS_URL && process.env.REDIS_URL.includes("@")) {
    console.log("✅ Using REDIS_URL with auth");
    return {
      url: process.env.REDIS_URL,
      socket: { reconnectStrategy: (r) => Math.min(r * 100, 3000) }
    };
  }

  // Try building from individual parts
  if (process.env.REDISPASSWORD || process.env.REDIS_PASSWORD) {
    const host     = process.env.REDISHOST     || process.env.REDIS_HOST || "localhost";
    const port     = process.env.REDISPORT     || process.env.REDIS_PORT || "6379";
    const password = process.env.REDISPASSWORD || process.env.REDIS_PASSWORD;
    const user     = process.env.REDISUSER     || "default";
    const url      = `redis://${user}:${password}@${host}:${port}`;
    console.log("✅ Built Redis URL from parts:", url.substring(0, 30) + "...");
    return {
      url,
      socket: { reconnectStrategy: (r) => Math.min(r * 100, 3000) }
    };
  }

  // Fallback
  console.log("⚠️ Using fallback Redis URL");
  return {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    socket: { reconnectStrategy: (r) => Math.min(r * 100, 3000) }
  };
}

const config = getRedisConfig();

export const redisClient     = createClient(config);
export const redisSubscriber = createClient(config);

export async function connectRedis() {
  redisClient.on("error",     (err) => console.error("❌ Redis client error:",     err.message));
  redisSubscriber.on("error", (err) => console.error("❌ Redis subscriber error:", err.message));

  await redisClient.connect();
  await redisSubscriber.connect();
  console.log("✅ Redis connected and authenticated");
}

export async function publishMetric(jobId, data) {
  await redisClient.publish(`job:${jobId}:metrics`, JSON.stringify(data));
}

export async function publishComplete(jobId, summary) {
  await redisClient.publish(`job:${jobId}:complete`, JSON.stringify(summary));
}

export async function cacheArchitecture(id, data) {
  try {
    await redisClient.setEx(`arch:${id}`, 3600, JSON.stringify(data));
  } catch (err) {
    console.error("Cache error:", err.message);
  }
}

export async function getCachedArchitecture(id) {
  try {
    const raw = await redisClient.get(`arch:${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}