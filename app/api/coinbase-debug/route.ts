import { NextResponse } from "next/server"
import crypto from "crypto"

export async function GET() {
  try {
    // Get API credentials
    const apiKey = process.env.COINBASE_API_KEY
    const apiSecret = process.env.COINBASE_API_SECRET

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        {
          error: "API credentials not configured",
          keysConfigured: {
            apiKey: !!apiKey,
            apiSecret: !!apiSecret,
          },
        },
        { status: 400 },
      )
    }

    // Try a simple request to get accounts (should work with any valid API key)
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const method = "GET"
    const requestPath = "/api/v3/brokerage/accounts"

    // Create the message to sign
    const message = timestamp + method + requestPath

    // Create the signature
    const signature = crypto.createHmac("sha256", apiSecret).update(message).digest("hex")

    console.log("Making request to Coinbase with:", {
      url: `https://api.exchange.coinbase.com${requestPath}`,
      method,
      headers: {
        "CB-ACCESS-KEY": apiKey.substring(0, 4) + "..." + apiKey.substring(apiKey.length - 4),
        "CB-ACCESS-SIGN": signature.substring(0, 10) + "...",
        "CB-ACCESS-TIMESTAMP": timestamp,
      },
    })

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

    // Get response details
    const status = response.status
    const statusText = response.statusText
    const responseText = await response.text()

    // Try to parse the response as JSON
    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = null
    }

    return NextResponse.json({
      success: response.ok,
      status,
      statusText,
      responseData: responseData || responseText.substring(0, 500),
      requestDetails: {
        url: `https://api.exchange.coinbase.com${requestPath}`,
        method,
        timestamp,
      },
      apiKeyInfo: {
        length: apiKey.length,
        firstFourChars: apiKey.substring(0, 4),
        lastFourChars: apiKey.substring(apiKey.length - 4),
      },
    })
  } catch (error) {
    console.error("Error in Coinbase debug endpoint:", error)

    return NextResponse.json(
      {
        error: "Failed to connect to Coinbase API",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
