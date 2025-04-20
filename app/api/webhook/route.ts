import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { executeOrder } from "@/lib/coinbase-api"
import { monitoring } from "@/lib/monitoring-service"
import { notifications } from "@/lib/notification-service"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// Discord webhook URL
const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL

export async function POST(req: NextRequest) {
  try {
    // Get the raw request body for signature verification
    const rawBody = await req.text()
    let body: any

    try {
      body = JSON.parse(rawBody)
    } catch (error) {
      monitoring.error("Failed to parse webhook payload", { rawBody })
      return NextResponse.json({ success: false, message: "Invalid JSON payload" }, { status: 400 })
    }

    // Log the incoming webhook
    monitoring.info("Received webhook", { body })

    // Verify webhook signature if a secret is configured
    const webhookSecret = process.env.WEBHOOK_SECRET
    const signature = req.headers.get("x-tradingview-webhook-signature")
    const passphrase = body.passphrase

    // Check either signature or passphrase
    if (webhookSecret) {
      let isAuthenticated = false

      // Check signature if provided
      if (signature) {
        const hmac = crypto.createHmac("sha256", webhookSecret)
        hmac.update(rawBody)
        const computedSignature = hmac.digest("hex")
        isAuthenticated = computedSignature === signature
      }

      // Check passphrase if provided
      if (passphrase && !isAuthenticated) {
        isAuthenticated = passphrase === webhookSecret
      }

      if (!isAuthenticated) {
        monitoring.warn("Webhook authentication failed", {
          hasSignature: !!signature,
          hasPassphrase: !!passphrase,
        })
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
      }
    }

    // Extract trading parameters from the webhook payload
    // Support multiple formats from different sources
    const ticker = body.ticker || body.symbol || body.product_id
    const action = body.action || body.side || body.order_action
    const quantity = body.quantity || body.size || body.position_size || "0.001" // Default small quantity
    const price = body.price || body.limit_price
    const type = body.type || body.order_type || "market"
    const timeInForce = body.time_in_force || body.timeInForce || "IOC"

    // Validate required parameters
    if (!ticker || !action) {
      monitoring.warn("Missing required parameters", { body })
      return NextResponse.json(
        { success: false, message: "Missing required parameters: ticker and action" },
        { status: 400 },
      )
    }

    // Normalize the action to lowercase
    const normalizedAction = action.toLowerCase()

    // Validate the action
    if (!["buy", "sell"].includes(normalizedAction)) {
      monitoring.warn("Invalid action", { action })
      return NextResponse.json({ success: false, message: "Invalid action. Must be 'buy' or 'sell'" }, { status: 400 })
    }

    // Format the ticker if needed (e.g., convert BTCUSD to BTC-USD)
    const formattedTicker = formatTicker(ticker)

    // Log the trade attempt
    monitoring.info(`Processing ${normalizedAction} order for ${formattedTicker}`, {
      quantity,
      price: price || "market",
      type,
    })

    // Execute the order on Coinbase
    const orderResult = await executeOrder({
      side: normalizedAction,
      product_id: formattedTicker,
      size: quantity.toString(),
      type: type.toLowerCase(),
      price: price?.toString(),
      time_in_force: timeInForce,
    })

    // Log the successful trade
    monitoring.recordTradeEvent({
      orderId: orderResult.orderId,
      productId: formattedTicker,
      side: normalizedAction.toUpperCase(),
      size: quantity.toString(),
      price: price?.toString() || "MARKET",
      status: orderResult.status,
      timestamp: new Date().toISOString(),
    })

    // Send notification to Discord if configured
    if (discordWebhookUrl) {
      await sendDiscordNotification({
        ticker: formattedTicker,
        action: normalizedAction,
        quantity,
        price: price || "market",
        orderResult,
      })
    }

    // Log to Supabase if configured
    if (supabase) {
      await logToSupabase({
        ticker: formattedTicker,
        action: normalizedAction,
        quantity,
        price: price || "market",
        orderResult,
      })
    }

    // Send a notification
    notifications.success(
      "Trade Executed",
      `Successfully executed ${normalizedAction} order for ${quantity} ${formattedTicker}`,
      orderResult,
    )

    // Return the order result
    return NextResponse.json({
      success: true,
      message: `Order ${normalizedAction} for ${formattedTicker} processed successfully`,
      order: orderResult,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error processing webhook:", error)
    monitoring.error("Error processing webhook", {
      error: error instanceof Error ? error.message : "Unknown error",
    })

    // Send error notification
    notifications.error(
      "Webhook Error",
      `Failed to process webhook: ${error instanceof Error ? error.message : "Unknown error"}`,
    )

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error processing webhook",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

// Helper function to format ticker symbols for Coinbase
function formatTicker(ticker: string): string {
  // If ticker already has a dash (e.g., BTC-USD), return as is
  if (ticker.includes("-")) return ticker

  // Handle common formats like BTCUSD
  if (/^[A-Z]{3,4}[A-Z]{3}$/.test(ticker)) {
    // Find the currency part (usually the last 3 characters)
    const baseCurrency = ticker.slice(0, -3)
    const quoteCurrency = ticker.slice(-3)
    return `${baseCurrency}-${quoteCurrency}`
  }

  // If we can't determine the format, return as is
  return ticker
}

// Function to send Discord notification
async function sendDiscordNotification({ ticker, action, quantity, price, orderResult }: any) {
  try {
    if (!discordWebhookUrl) return

    // Format the trade result for the message
    const resultDetails = orderResult.orderId ? `✅ Order ID: ${orderResult.orderId}` : "❌ Order failed"

    // Create a rich embed message
    const message = {
      embeds: [
        {
          title: `🚨 Trade Executed: ${action.toUpperCase()} ${ticker}`,
          color: action.toLowerCase() === "buy" ? 3066993 : 15158332, // Green for buy, red for sell
          fields: [
            {
              name: "Symbol",
              value: ticker,
              inline: true,
            },
            {
              name: "Action",
              value: action.toUpperCase(),
              inline: true,
            },
            {
              name: "Quantity",
              value: quantity.toString(),
              inline: true,
            },
            {
              name: "Price",
              value: typeof price === "number" ? `$${price.toFixed(2)}` : price,
              inline: true,
            },
            {
              name: "Status",
              value: resultDetails,
            },
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: "TradingView Webhook",
          },
        },
      ],
    }

    const response = await fetch(discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      const errorText = await response.text()
      monitoring.error("Discord notification error", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      })
    }
  } catch (error) {
    monitoring.error("Failed to send Discord notification", {
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// Function to log trade to Supabase
async function logToSupabase({ ticker, action, quantity, price, orderResult }: any) {
  try {
    if (!supabase) {
      monitoring.warn("Supabase not configured, skipping webhook logging")
      return
    }

    // Create the trade log entry
    const tradeLog = {
      ticker,
      action: action.toUpperCase(),
      price: typeof price === "string" ? price : JSON.stringify(price),
      quantity: quantity.toString(),
      trade_id: orderResult.orderId || null,
      status: orderResult.status || "unknown",
      error_message: orderResult.error || null,
      created_at: new Date().toISOString(),
      webhook_payload: JSON.stringify({
        ticker,
        action,
        quantity,
        price,
        orderResult,
      }),
      ip_address: null, // We could add this if needed
      user_agent: null, // We could add this if needed
    }

    // Insert the trade log into Supabase
    const { error } = await supabase.from("trade_logs").insert([tradeLog])

    if (error) {
      monitoring.error("Supabase log error", { error })
    } else {
      monitoring.info("Successfully logged webhook to Supabase", { ticker, action })
    }
  } catch (error) {
    monitoring.error("Failed to log to Supabase", {
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
