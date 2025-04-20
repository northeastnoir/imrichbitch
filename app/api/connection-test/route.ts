import { NextResponse } from "next/server"
import crypto from "crypto"

export async function GET() {
  try {
    // Check if Coinbase API keys are configured
    const apiKey = process.env.COINBASE_API_KEY
    const apiSecret = process.env.COINBASE_API_SECRET
    const webhookSecret = process.env.WEBHOOK_SECRET
    const accessPassword = process.env.NEXT_PUBLIC_ACCESS_PASSWORD

    // Verify environment variables
    const environmentStatus = {
      coinbaseApiKey: !!apiKey,
      coinbaseApiSecret: !!apiSecret,
      webhookSecret: !!webhookSecret,
      accessPassword: !!accessPassword,
    }

    // Test Coinbase API connection if credentials are available
    let coinbaseStatus = { connected: false, message: "API credentials not configured" }

    if (apiKey && apiSecret) {
      try {
        // Make a simple request to the Coinbase API to test connectivity
        const timestamp = Math.floor(Date.now() / 1000).toString()
        const method = "GET"
        const requestPath = "/api/v3/products"

        // Create signature
        const message = timestamp + method + requestPath
        const signature = crypto.createHmac("sha256", apiSecret).update(message).digest("hex")

        const response = await fetch(`https://api.exchange.coinbase.com${requestPath}`, {
          method,
          headers: {
            "CB-ACCESS-KEY": apiKey,
            "CB-ACCESS-SIGN": signature,
            "CB-ACCESS-TIMESTAMP": timestamp,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const products = await response.json()
          coinbaseStatus = {
            connected: true,
            message: "Successfully connected to Coinbase API",
            productsCount: Array.isArray(products) ? products.length : 0,
          }
        } else {
          const errorText = await response.text()
          coinbaseStatus = {
            connected: false,
            message: `Coinbase API error: ${response.status} ${response.statusText}`,
            details: errorText.substring(0, 200),
          }
        }
      } catch (error) {
        coinbaseStatus = {
          connected: false,
          message: error instanceof Error ? error.message : "Unknown error connecting to Coinbase API",
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: environmentStatus,
      coinbase: coinbaseStatus,
    })
  } catch (error) {
    console.error("Error in connection test:", error)
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error in connection test",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
