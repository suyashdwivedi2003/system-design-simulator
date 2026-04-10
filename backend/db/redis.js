// ─────────────────────────────────────────────────────────────────
//  db/redis.js
//
//  Sets up TWO Redis clients:
//    1. redisClient     → general purpose (get/set/cache)
//    2. redisSubscriber → dedicated to pub/sub listening
//
//  WHY TWO CLIENTS?
//  Redis has a rule: once a client enters "subscribe" mode,
//  it can ONLY listen — it can't publish or run other commands.
//  So we need a separate client for each role.
//
//  HOW PUB/SUB WORKS HERE:
//  - Load test worker  → publishes metric updates to a channel
//  - Socket.io server  → subscribes to that channel
//  - When a message arrives → server forwards it to the browser
// ─────────────────────────────────────────────────────────────────

import { createClient } from "redis";

// ── Publisher / general client ────────────────────────────────────
export const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

// ── Subscriber client (dedicated to pub/sub) ──────────────────────
export const redisSubscriber = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

// ── Connect both clients ──────────────────────────────────────────
export async function connectRedis() {
  redisClient.on("error", (err) =>
    console.error("❌ Redis client error:", err)
  );
  redisSubscriber.on("error", (err) =>
    console.error("❌ Redis subscriber error:", err)
  );

  await redisClient.connect();
  await redisSubscriber.connect();

  console.log("✅ Redis connected");
}

// ── Helper: publish a metric update to a job's channel ───────────
// Channel name pattern: "job:<jobId>:metrics"
export async function publishMetric(jobId, data) {
  const channel = `job:${jobId}:metrics`;
  await redisClient.publish(channel, JSON.stringify(data));
}

// ── Helper: publish job completion ────────────────────────────────
export async function publishComplete(jobId, summary) {
  const channel = `job:${jobId}:complete`;
  await redisClient.publish(channel, JSON.stringify(summary));
}

// ── Helper: cache architecture for fast retrieval ─────────────────
export async function cacheArchitecture(id, data) {
  // Cache for 1 hour (3600 seconds)
  await redisClient.setEx(`arch:${id}`, 3600, JSON.stringify(data));
}

export async function getCachedArchitecture(id) {
  const raw = await redisClient.get(`arch:${id}`);
  return raw ? JSON.parse(raw) : null;
}