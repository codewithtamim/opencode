import { getRedis, buildRateLimitKey } from "./redis"
import { Resource } from "@opencode-ai/console-resource"
import { logger } from "./logger"

export async function clearRateLimitsOnStartup() {
  // Clear rate limits in development, staging, and QA environments
  const shouldClear =
    process.env.NODE_ENV === "development" ||
    process.env.OPENCODE_QA_MODE === "1" ||
    Resource.App.stage === "development" ||
    Resource.App.stage === "staging"

  if (!shouldClear) {
    return
  }

  try {
    const redis = getRedis()
    const stage = Resource.App.stage || "development"

    // All rate limit patterns to clear
    const patterns = [
      `${stage}:ratelimit:*`, // Catch-all for all rate limit keys
      "*:ratelimit:ip:*", // IP-based rate limits (any stage)
      "*:ratelimit:key:*", // Key-based rate limits (any stage)
      "*:ratelimit:trial:*", // Trial rate limits (any stage)
      "*:ratelimit:checkout:*", // Checkout rate limits (any stage)
    ]

    let totalCleared = 0

    for (const pattern of patterns) {
      try {
        const keys = await redis.keys(pattern)
        if (keys && keys.length > 0) {
          // Delete in batches to avoid overwhelming Redis
          const batchSize = 100
          for (let i = 0; i < keys.length; i += batchSize) {
            const batch = keys.slice(i, i + batchSize)
            await redis.del(...batch)
            totalCleared += batch.length
          }
        }
      } catch (error) {
        // Continue with other patterns if one fails
        logger.debug(`Could not clear pattern ${pattern}:`, error)
      }
    }

    if (totalCleared > 0) {
      logger.info(`✅ QA Mode: Cleared ${totalCleared} rate limit keys on startup`)
    } else {
      logger.debug("✅ QA Mode: No rate limit keys to clear")
    }
  } catch (error) {
    // Don't block server startup if Redis is down - QA mode is best-effort
    logger.debug("Note: Rate limit cache cleanup skipped (Redis unavailable or QA mode disabled)")
  }
}
