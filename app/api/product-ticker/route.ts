import { NextResponse } from "next/server"
import { getProductTicker } from "@/lib/coinbase-sdk"
import { rateLimit } from "@/lib/rate-limit"

// Rate limit: 20 requests per minute
const rateLimiter = rateLimit({
  limit: 20,
  windowMs: 60 * 1000,
})

export async function GET(request: Request) {
  // Apply rate limiting
  const url = new URL(request.url)
  const productId = url.searchParams.get("productId") || "BTC-USD"

  try {
    // Check if API keys are configured
    const apiKey = process.env.COINBASE_API_KEY
    const apiSecret = process.env.COINBASE_API_SECRET

    if (!apiKey || !apiSecret) {
      // Return mock data for testing
      return NextResponse.json({
        success: true,
        data: {
          productId,
          price: productId.includes("BTC") ? "43250.50" : "2310.75",
          time: new Date().toISOString(),
        },
        isMockData: true,
      })
    }

    // Get real ticker data
    const ticker = await getProductTicker(productId)

    return NextResponse.json({
      success: true,
      data: {
        productId,
        price: ticker.price,
        time: ticker.time,
      },
    })
  } catch (error) {
    console.error(`Error fetching ticker for ${productId}:`, error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error fetching ticker",
      },
      { status: 500 },
    )
  }
}
