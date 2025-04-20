import { NextResponse } from "next/server"
import { testConnection } from "@/lib/coinbase-api"

export async function GET() {
  try {
    // Check if API keys are configured
    const apiKey = process.env.COINBASE_API_KEY
    const apiSecret = process.env.COINBASE_API_SECRET

    if (!apiKey || !apiSecret) {
      return NextResponse.json({
        success: false,
        message: "API credentials not found in environment variables",
        timestamp: new Date().toISOString(),
      })
    }

    console.log("Testing Coinbase API credentials using JWT authentication...")

    // Test connection using the JWT authentication
    const result = await testConnection()

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Coinbase API credentials are valid",
        details: result.details,
        timestamp: new Date().toISOString(),
      })
    } else {
      return NextResponse.json({
        success: false,
        message: "Coinbase API credentials are invalid",
        details: {
          error: result.message,
        },
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("Error verifying credentials:", error)
    return NextResponse.json({
      success: false,
      message: "Error verifying credentials",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
