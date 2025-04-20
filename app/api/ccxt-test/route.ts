import { NextResponse } from "next/server"
import ccxt from "ccxt"

export async function GET() {
  try {
    // Initialize Coinbase Pro connection via CCXT
    const exchange = new ccxt.coinbasepro({
      apiKey: process.env.COINBASE_API_KEY,
      secret: process.env.COINBASE_API_SECRET,
      enableRateLimit: true,
    })

    // Test connection by fetching markets
    console.log("Testing CCXT connection to Coinbase...")
    const markets = await exchange.loadMarkets()

    // Get BTC/USD ticker as a test
    const ticker = await exchange.fetchTicker("BTC/USD")

    return NextResponse.json({
      success: true,
      message: "Successfully connected to Coinbase via CCXT",
      marketsCount: Object.keys(markets).length,
      btcUsdPrice: ticker.last,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error testing CCXT connection:", error)

    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error connecting to Coinbase via CCXT",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
