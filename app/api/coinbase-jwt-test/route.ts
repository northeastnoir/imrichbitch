import { NextResponse } from "next/server"
import { makeJwtAuthenticatedRequest } from "@/lib/coinbase-jwt"

export async function GET() {
  try {
    // Check if API keys are configured
    const apiKeyId = process.env.COINBASE_API_KEY
    const privateKey = process.env.COINBASE_PRIVATE_KEY

    if (!apiKeyId || !privateKey) {
      return NextResponse.json({
        success: false,
        message: "Coinbase API credentials not configured",
        keysConfigured: {
          apiKeyId: !!apiKeyId,
          privateKey: !!privateKey,
        },
      })
    }

    // Try to get a list of accounts as a simple test
    console.log("Testing Coinbase API connection with JWT authentication...")

    const response = await makeJwtAuthenticatedRequest("GET", "/api/v3/brokerage/accounts")

    return NextResponse.json({
      success: true,
      message: "Successfully connected to Coinbase API using JWT authentication",
      accountsCount: response.accounts?.length || 0,
      firstAccount: response.accounts?.[0]
        ? {
            uuid: response.accounts[0].uuid,
            name: response.accounts[0].name,
            currency: response.accounts[0].currency,
          }
        : null,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error testing Coinbase JWT connection:", error)

    return NextResponse.json({
      success: false,
      message: "Failed to connect to Coinbase API using JWT authentication",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
