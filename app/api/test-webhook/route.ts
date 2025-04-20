import { NextResponse } from "next/server"

export async function GET() {
  // Check if required environment variables are set
  const environmentStatus = {
    coinbaseApiKey: !!process.env.COINBASE_API_KEY,
    coinbaseApiSecret: !!process.env.COINBASE_API_SECRET,
    webhookSecret: !!process.env.WEBHOOK_SECRET,
    discordWebhook: !!process.env.DISCORD_WEBHOOK_URL,
    supabaseUrl: !!process.env.SUPABASE_URL,
    supabaseKey: !!process.env.SUPABASE_KEY,
  }

  // Count how many are configured
  const configuredCount = Object.values(environmentStatus).filter(Boolean).length
  const totalCount = Object.keys(environmentStatus).length

  return NextResponse.json({
    status: "TradingView webhook system is ready",
    environmentStatus,
    configuredServices: `${configuredCount}/${totalCount}`,
    timestamp: new Date().toISOString(),
    webhookUrl: "/api/tradingview-webhook",
    testPayload: {
      ticker: "BTC-USD",
      action: "BUY",
      price: "45000",
      quantity: "0.001",
    },
  })
}
