import { NextResponse } from "next/server"
import { TradingService, OrderSide } from "@/lib/trading-service"
import { monitoring } from "@/lib/monitoring-service"
import { rateLimit } from "@/lib/rate-limit"

// Strict rate limit for test trades: 5 requests per minute
const rateLimiter = rateLimit({
  limit: 5,
  windowMs: 60 * 1000,
})

export async function POST(request: Request) {
  // Apply rate limiting
  const rateLimit = await rateLimiter(request)
  if (rateLimit) return rateLimit

  try {
    const body = await request.json()
    const { productId, side, quantity, simulation = true } = body

    // Validate inputs
    if (!productId || !side || !quantity) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required fields: productId, side, and quantity are required",
        },
        { status: 400 },
      )
    }

    // Log the test trade attempt
    monitoring.info(`Test trade requested: ${side} ${quantity} ${productId} (simulation: ${simulation})`)

    // If simulation mode, don't actually execute the trade
    if (simulation) {
      monitoring.info(`SIMULATION: ${side} ${quantity} ${productId}`)

      // Return simulated success response
      return NextResponse.json({
        success: true,
        message: `[SIMULATION] Successfully placed ${side} order for ${quantity} ${productId}`,
        orderId: `sim-${Date.now()}`,
        status: "FILLED",
        filledSize: quantity,
        simulation: true,
      })
    }

    // Execute the actual trade
    const orderSide = side.toUpperCase() === "BUY" ? OrderSide.BUY : OrderSide.SELL

    const order = await TradingService.createMarketOrder(productId, orderSide, quantity.toString())

    // Log the successful trade
    monitoring.info(`Test trade executed:`, order)

    // Record the trade event
    monitoring.recordTradeEvent({
      orderId: order.orderId,
      productId: order.productId,
      side: orderSide,
      size: quantity.toString(),
      status: order.status,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: `Successfully placed ${orderSide} order for ${quantity} ${productId}`,
      orderId: order.orderId,
      status: order.status,
      filledSize: order.filledSize,
      filledValue: order.filledValue,
    })
  } catch (error) {
    console.error("Error executing test trade:", error)
    monitoring.error("Test trade failed:", error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error executing test trade",
      },
      { status: 500 },
    )
  }
}
