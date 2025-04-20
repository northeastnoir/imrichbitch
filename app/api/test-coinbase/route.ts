import { NextResponse } from "next/server"
import { CoinbaseAPIError } from "@/lib/coinbase-api"
import crypto from "crypto"

export async function GET() {
  try {
    // Check if Coinbase API keys are configured
    const apiKey = process.env.COINBASE_API_KEY
    const apiSecret = process.env.COINBASE_API_SECRET

    if (!apiKey || !apiSecret) {
      return NextResponse.json({
        success: false,
        message: "Coinbase API credentials not configured",
        timestamp: new Date().toISOString(),
      })
    }

    // Make a simple request to the Coinbase API to test connectivity
    const timestamp = Math.floor(Date.now() / 1000).toString()
    const method = "GET"
    const requestPath = "/api/v3/products"

    // Create signature
    const message = timestamp + method + requestPath
    const signature = crypto.createHmac("sha256", apiSecret).update(message).digest("hex")

    try {
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
        const errorData = { message: `HTTP error ${response.status}` }

        try {
          const parsedError = JSON.parse(errorText)
          if (parsedError && parsedError.message) {
            errorData.message = parsedError.message
          }
        } catch (e) {
          // If parsing fails, use the error text directly
          errorData.message = errorText.substring(0, 200)
        }

        // Check for authentication errors
        if (
          response.status === 401 ||
          errorData.message.includes("invalid") ||
          errorData.message.includes("Invalid API Key") ||
          errorData.message.includes("authentication")
        ) {
          return NextResponse.json({
            success: false,
            message: "Authentication failed: Invalid API credentials",
            details: errorData.message,
            timestamp: new Date().toISOString(),
          })
        }

        return NextResponse.json({
          success: false,
          message: `Coinbase API error: ${response.status} ${response.statusText}`,
          details: errorData.message,
          timestamp: new Date().toISOString(),
        })
      }

      const products = await response.json()

      return NextResponse.json({
        success: true,
        message: "Successfully connected to Coinbase API",
        productsCount: Array.isArray(products) ? products.length : 0,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      // Check if it's an authentication error
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      const isAuthError =
        (error instanceof CoinbaseAPIError && error.type === "InvalidCredentials") ||
        errorMessage.includes("Invalid API Key") ||
        errorMessage.includes("Authentication failed")

      return NextResponse.json({
        success: false,
        message: isAuthError
          ? "Authentication failed: Invalid API credentials. Please check your Coinbase API key and secret in your Vercel environment variables."
          : errorMessage,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("Error testing Coinbase connection:", error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error connecting to Coinbase API",
      timestamp: new Date().toISOString(),
    })
  }
}
