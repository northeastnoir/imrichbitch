import { NextResponse } from "next/server"
import crypto from "crypto"

export async function GET() {
  try {
    // Check if API keys are configured
    const apiKey = process.env.COINBASE_API_KEY
    const apiSecret = process.env.COINBASE_API_SECRET

    if (!apiKey || !apiSecret) {
      return NextResponse.json({
        success: false,
        message: "API credentials not configured",
        timestamp: new Date().toISOString(),
      })
    }

    // Make a simple request to the Coinbase API to test connectivity
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const method = "GET"
    const requestPath = "/api/v3/brokerage/accounts"

    // Create signature
    const message = timestamp + method + requestPath
    const signature = crypto.createHmac("sha256", apiSecret).update(message).digest("hex")

    console.log("Testing Coinbase API connection with Advanced Trade API...")
    console.log("Request details:", {
      url: `https://api.exchange.coinbase.com${requestPath}`,
      method,
      headers: {
        "CB-ACCESS-KEY": apiKey.substring(0, 4) + "...",
        "CB-ACCESS-TIMESTAMP": timestamp,
      },
    })

    const response = await fetch(`https://api.exchange.coinbase.com${requestPath}`, {
      method,
      headers: {
        "CB-ACCESS-KEY": apiKey,
        "CB-ACCESS-SIGN": signature,
        "CB-ACCESS-TIMESTAMP": timestamp,
        "Content-Type": "application/json",
      },
    })

    console.log("Response status:", response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Error response:", errorText)

      return NextResponse.json({
        success: false,
        message: `Coinbase API error: ${response.status} ${response.statusText}`,
        details: errorText.substring(0, 500),
        timestamp: new Date().toISOString(),
      })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: "Successfully connected to Coinbase API",
      accountsCount: data.accounts?.length || 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error testing Coinbase connection:", error)

    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error connecting to Coinbase API",
      timestamp: new Date().toISOString(),
    })
  }
}
