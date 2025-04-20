import { type NextRequest, NextResponse } from "next/server"

export interface RateLimitConfig {
  limit: number // Maximum number of requests
  windowMs: number // Time window in milliseconds
  keyGenerator?: (req: NextRequest) => string // Function to generate a unique key for the request
}

const ipRequestCounts = new Map<string, { count: number; resetTime: number }>()

// Clean up expired rate limit entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, data] of ipRequestCounts.entries()) {
    if (data.resetTime <= now) {
      ipRequestCounts.delete(key)
    }
  }
}, 60000) // Clean up every minute

export function rateLimit(config: RateLimitConfig) {
  return async function rateLimitMiddleware(req: NextRequest) {
    // Generate a key for this request (default to IP address)
    const key = config.keyGenerator ? config.keyGenerator(req) : req.ip || "unknown"

    const now = Date.now()

    // Get or initialize rate limit data for this key
    let rateLimitData = ipRequestCounts.get(key)

    if (!rateLimitData || rateLimitData.resetTime <= now) {
      // If no data or window expired, create new entry
      rateLimitData = {
        count: 0,
        resetTime: now + config.windowMs,
      }
    }

    // Increment request count
    rateLimitData.count++

    // Update the map
    ipRequestCounts.set(key, rateLimitData)

    // Check if rate limit exceeded
    if (rateLimitData.count > config.limit) {
      const retryAfter = Math.ceil((rateLimitData.resetTime - now) / 1000)

      return NextResponse.json(
        {
          success: false,
          message: "Too many requests, please try again later",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(config.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(rateLimitData.resetTime / 1000)),
          },
        },
      )
    }

    // Request is allowed, return null to continue
    return null
  }
}
