import { NextResponse } from "next/server"
import { executeOrder } from "@/lib/coinbase-api"

// Optional: Add Discord and Supabase integration
// import { createClient } from '@supabase/supabase-js'
// const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!)

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json()
    const { ticker, action, price, quantity } = body

    // Validate incoming data
    if (!ticker || !action || !quantity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Map the ticker to Coinbase product_id format if needed
    // Coinbase uses format like "BTC-USD" while some systems might send "BTCUSD"
    const productId = ticker.includes("-") ? ticker : `${ticker.slice(0, 3)}-${ticker.slice(3)}`

    // Execute Coinbase trade using our lib/coinbase-api.ts
    const tradeResult = await executeOrder({
      product_id: productId,
      side: action.toLowerCase(), // buy or sell
      size: quantity.toString(),
      type: "market",
    })

    // Optional: Notify Discord
    // await notifyDiscord({ ticker, action, price, quantity, tradeResult })

    // Optional: Log trade to Supabase
    // await logToSupabase({ ticker, action, price, quantity, tradeResult })

    return NextResponse.json({
      status: "Trade executed",
      tradeResult,
    })
  } catch (error) {
    console.error("Error executing trade:", error)

    return NextResponse.json(
      {
        error: "Failed to execute trade",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

// Discord notification function
async function notifyDiscord({ ticker, action, price, quantity, tradeResult }: any) {
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL

  if (!discordWebhookUrl) {
    console.warn("Discord webhook URL not configured")
    return
  }

  const message = {
    content: `🚨 **Trade Executed**: ${action} ${quantity} of ${ticker} at approx. ${price}\nResult: ${tradeResult.orderId || JSON.stringify(tradeResult)}`,
  }

  try {
    await fetch(discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    })
  } catch (error) {
    console.error("Discord notification error:", error)
  }
}

// Supabase logging function
async function logToSupabase({ ticker, action, price, quantity, tradeResult }: any) {
  // Uncomment and use this if you have Supabase set up
  /*
  const { data, error } = await supabase.from("trade_logs").insert({
    ticker,
    action,
    price,
    quantity,
    trade_id: tradeResult.orderId || null,
    status: tradeResult.error ? "error" : "completed",
    error_message: tradeResult.error || null,
    created_at: new Date().toISOString(),
  })

  if (error) console.error("Supabase log error:", error)
  return data
  */

  // For now, just log to console
  console.log("Trade logged:", { ticker, action, price, quantity, tradeResult })
}
