import { NextResponse } from "next/server"
import ccxt from "ccxt"

export async function POST(request: Request) {
  try {
    // Parse the request body
    const payload = await request.json()
    console.log("Received payload:", payload)

    // Initialize Coinbase Pro connection via CCXT
    const exchange = new ccxt.coinbasepro({
      apiKey: process.env.COINBASE_API_KEY,
      secret: process.env.COINBASE_API_SECRET,
      enableRateLimit: true,
      // options: { sandbox: true } // Uncomment for sandbox testing
    })

    // Validate and extract required parameters
    const symbol = payload.symbol || "BTC/USD"
    const side = payload.side || "buy"
    const amount = payload.amount || 0.001
    const orderType = payload.orderType || "market"

    // Place order on Coinbase using CCXT
    const order = await exchange.createOrder(symbol, orderType, side, amount)
    console.log("Order placed:", order)

    return NextResponse.json({
      success: true,
      message: "Order placed successfully",
      order,
    })
  } catch (error) {
    console.error("Error placing order:", error)

    return NextResponse.json(
      {
        success: false,
        error: "Error placing order",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
