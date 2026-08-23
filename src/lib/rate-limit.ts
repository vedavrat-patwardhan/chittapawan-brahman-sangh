import { createHash } from "node:crypto";

import { headers } from "next/headers";

import { rateLimitsCollection } from "@/lib/mongodb";

export async function requestFingerprint(scope: string): Promise<string> {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwarded || requestHeaders.get("x-real-ip") || "unknown";
  const userAgent = requestHeaders.get("user-agent") || "unknown";
  return createHash("sha256")
    .update(`${scope}:${ip}:${userAgent}`)
    .digest("hex");
}

export async function consumeRateLimit(input: {
  key: string;
  limit: number;
  windowMs: number;
}): Promise<{ allowed: boolean; retryAfterSeconds: number }> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + input.windowMs);
  const collection = await rateLimitsCollection();
  const existing = await collection.findOne({ key: input.key });

  if (!existing || existing.reset_at <= now) {
    await collection.updateOne(
      { key: input.key },
      {
        $set: {
          count: 1,
          reset_at: resetAt,
          expires_at: resetAt,
        },
        $setOnInsert: { key: input.key },
      },
      { upsert: true },
    );
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= input.limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.reset_at.getTime() - now.getTime()) / 1000),
      ),
    };
  }

  await collection.updateOne({ key: input.key }, { $inc: { count: 1 } });
  return { allowed: true, retryAfterSeconds: 0 };
}

export async function clearRateLimit(key: string): Promise<void> {
  const collection = await rateLimitsCollection();
  await collection.deleteOne({ key });
}
