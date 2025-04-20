import { NextResponse } from "next/server"
import { TradingService, OrderSide } from "@/lib/trading-service"
import { notifyDiscord } from "@/lib/discord-notify"
import { logToSupabase } from "@/lib/supabase-logger"
import { monitoring } from "@/lib/monitoring-service"

// Verify webhook secret to ensure requests are coming from authorized sources
function verifyWebhookSecret(request: Request): boolean {
  const authHeader = request.headers.get("authorization")
  if (!authHeader) return false

  // Simple Bearer token authentication
  const [type, token] = authHeader.split(" ")
  if (type !== "Bearer") return false

  return token === process.env.WEBHOOK_SECRET
}

export async function POST(request: Request) {
  try {
    // Log the incoming webhook
    monitoring.info("Received TradingView webhook request")

    // Optional: Verify the webhook secret
    if (process.env.WEBHOOK_SECRET && !verifyWebhookSecret(request)) {
      monitoring.warn("Unauthorized webhook attempt", { headers: Object.fromEntries(request.headers) })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse the request body
    const body = await request.json()
    monitoring.info("TradingView webhook payload", body)

    // Handle different TradingView alert formats
    // Format 1: {ticker, action, price, quantity}
    // Format 2: {symbol, side, price, size}
    // Format 3: {strategy.order.action, strategy.position_size}

    let ticker = body.ticker || body.symbol || body.productId || "BTC-USD"
    let action = body.action || body.side || body.order || "BUY"
    const quantity = body.quantity || body.size || body.position_size || "0.001"
    const price = body.price || body.limit_price || null

    // Normalize ticker format (ensure it's in BTC-USD format)
    if (ticker && !ticker.includes("-") && ticker.length >= 6) {
      // Convert formats like BTCUSD to BTC-USD
      ticker = `${ticker.slice(0, 3)}-${ticker.slice(3)}`
    }

    // Normalize action to uppercase
    action = action.toUpperCase()

    // Validate incoming data
    if (!ticker || !action || !quantity) {
      monitoring.error("Invalid webhook data", { body })
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Map action to OrderSide enum
    const side = action === "BUY" || action === "LONG" ? OrderSide.BUY : OrderSide.SELL

    // Execute trade using TradingService
    monitoring.info(`Executing ${side} order for ${ticker}`, { quantity, price })

    let tradeResult
    if (price) {
      // Execute limit order if price is provided
      tradeResult = await TradingService.createLimitOrder(ticker, side, quantity.toString(), price.toString())
    } else {
      // Execute market order if no price is provided
      tradeResult = await TradingService.createMarketOrder(ticker, side, quantity.toString())
    }

    // Notify Discord (if configured)
    if (process.env.DISCORD_WEBHOOK_URL) {
      await notifyDiscord({
        ticker,
        action: side,
        price: price || "MARKET",
        quantity,
        tradeResult,
      })
    }

    // Log trade to Supabase (if configured)
    if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY) {
      await logToSupabase({
        ticker,
        action: side,
        price: price || "MARKET",
        quantity,
        tradeResult,
      })
    }

    // Record the trade event in monitoring
    monitoring.recordTradeEvent({
      orderId: tradeResult.orderId,
      productId: ticker,
      side: side,
      size: quantity.toString(),
      price: price?.toString(),
      status: tradeResult.status,
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      status: "Trade executed",
      tradeResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error processing TradingView webhook:", error)
    monitoring.error("Failed to process TradingView webhook", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    })

    return NextResponse.json(
      {
        error: "Failed to process webhook",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
