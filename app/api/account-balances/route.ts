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
        data: [
          {
            id: "mock-usd",
            currency: "USD",
            available_balance: { value: "10000.00", currency: "USD" },
            hold: { value: "0.00", currency: "USD" },
          },
          {
            id: "mock-btc",
            currency: "BTC",
            available_balance: { value: "0.25", currency: "BTC" },
            hold: { value: "0.00", currency: "BTC" },
          },
          {
            id: "mock-eth",
            currency: "ETH",
            available_balance: { value: "2.5", currency: "ETH" },
            hold: { value: "0.00", currency: "ETH" },
          },
        ],
        isMockData: true,
      })
    }

    // Get real account balances
    const balances = await TradingService.getAccountBalances()

    return NextResponse.json({
      success: true,
      data: balances,
    })
  } catch (error) {
    console.error("Error fetching account balances:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error fetching account balances",
      },
      { status: 500 },
    )
  }
}
