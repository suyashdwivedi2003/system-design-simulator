import { createClient } from "redis";

// ── Build Redis config ────────────────────────────────────────────
// Railway provides REDIS_URL with password included:
// redis://default:PASSWORD@redis.railway.internal:6379
// We use the full URL which includes auth automatically.

function getRedisConfig() {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  console.log("🔄 Redis URL (masked):", url.replace(/:([^:@]+)@/, ":***@"));
  return { url, socket: { reconnectStrategy: (retries) => Math.min(retries * 100, 3000) } };
}

// ── Publisher / general client ────────────────────────────────────
export const redisClient = createClient(getRedisConfig());

// ── Subscriber client ─────────────────────────────────────────────
export const redisSubscriber = createClient(getRedisConfig());

// ── Connect both ──────────────────────────────────────────────────
export async function connectRedis() {
  redisClient.on("error", (err) => {
    if (!err.message.includes("NOAUTH"))
      console.error("❌ Redis client error:", err.message);
  });

  redisSubscriber.on("error", (err) => {
    if (!err.message.includes("NOAUTH"))
      console.error("❌ Redis subscriber error:", err.message);
  });

  await redisClient.connect();
  await redisSubscriber.connect();

  // Test the connection with auth
  await redisClient.ping();
  console.log("✅ Redis connected and authenticated");
}

// ── Publish metric ────────────────────────────────────────────────
export async function publishMetric(jobId, data) {
  await redisClient.publish(`job:${jobId}:metrics`, JSON.stringify(data));
}

// ── Publish complete ──────────────────────────────────────────────
export async function publishComplete(jobId, summary) {
  await redisClient.publish(`job:${jobId}:complete`, JSON.stringify(summary));
}

// ── Cache helpers ─────────────────────────────────────────────────
export async function cacheArchitecture(id, data) {
  await redisClient.setEx(`arch:${id}`, 3600, JSON.stringify(data));
}

export async function getCachedArchitecture(id) {
  try {
    const raw = await redisClient.get(`arch:${id}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}