import { NextResponse } from "next/server"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    // Get credentials from request body
    const { apiKey, apiSecret } = await request.json()

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        {
          success: false,
          message: "API credentials not provided",
        },
        { status: 400 },
      )
    }

    // Make a simple request to the Coinbase API to test connectivity
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const method = "GET"
    const requestPath = "/api/v3/brokerage/accounts"

    // Create signature
    const message = timestamp + method + requestPath
    const signature = crypto.createHmac("sha256", apiSecret).update(message).digest("hex")

    console.log("Testing Coinbase API credentials...")

    // Make the request
    const response = await fetch(`https://api.exchange.coinbase.com${requestPath}`, {
      method,
      headers: {
        "CB-ACCESS-KEY": apiKey,
        "CB-ACCESS-SIGN": signature,
        "CB-ACCESS-TIMESTAMP": timestamp,
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json({
        success: false,
        message: `Coinbase API error: ${response.status} ${response.statusText}`,
        details: {
          status: response.status,
          statusText: response.statusText,
          error: errorText.substring(0, 200),
        },
      })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      message: "Coinbase API credentials are valid",
      details: {
        accountsCount: data.accounts?.length || 0,
      },
    })
  } catch (error) {
    console.error("Error verifying credentials:", error)

    return NextResponse.json(
      {
        success: false,
        message: "Error verifying credentials",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
