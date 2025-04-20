import { NextResponse } from "next/server"
import { TradingService } from "@/lib/trading-service"

export async function GET() {
  try {
    // Check if API keys are configured
    const apiKey = process.env.COINBASE_API_KEY
    const apiSecret = process.env.COINBASE_API_SECRET

    if (!apiKey || !apiSecret) {
      // Return mock data
      return NextResponse.json({
        success: true,
        data: [],
        isMockData: true,
      })
    }

    // Get real open orders
    const orders = await TradingService.getOpenOrders()

    return NextResponse.json({
      success: true,
      data: orders,
    })
  } catch (error) {
    console.error("Error fetching open orders:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error fetching open orders",
      },
      { status: 500 },
    )
  }
}
