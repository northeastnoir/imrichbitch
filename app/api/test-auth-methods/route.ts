import { NextResponse } from "next/server"
import { generateCoinbaseJWT } from "@/lib/coinbase-jwt"
import { makeHmacAuthenticatedRequest } from "@/lib/coinbase-api"

export async function GET() {
  try {
    // Check if API keys are configured
    const apiKey = process.env.COINBASE_API_KEY
    const apiSecret = process.env.COINBASE_API_SECRET
    const privateKey = process.env.COINBASE_PRIVATE_KEY

    if (!apiKey || (!apiSecret && !privateKey)) {
      return NextResponse.json({
        success: false,
        message: "API credentials not configured",
        keysConfigured: {
          apiKey: !!apiKey,
          apiSecret: !!apiSecret,
          privateKey: !!privateKey,
        },
      })
    }

    // Test results
    const results = {
      jwt: { success: false, message: "", error: "" },
      hmac: { success: false, message: "", error: "" },
    }

    // Test JWT authentication if private key is available
    if (privateKey) {
      try {
        const jwt = await generateCoinbaseJWT("GET", "/api/v3/brokerage/accounts")
        results.jwt = {
          success: true,
          message: "Successfully generated JWT token",
          error: "",
        }
      } catch (error) {
        results.jwt = {
          success: false,
          message: "Failed to generate JWT token",
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    } else {
      results.jwt = {
        success: false,
        message: "Private key not configured",
        error: "",
      }
    }

    // Test HMAC authentication if API secret is available
    if (apiSecret) {
      try {
        await makeHmacAuthenticatedRequest("/api/v3/brokerage/accounts", "GET")
        results.hmac = {
          success: true,
          message: "Successfully authenticated with HMAC",
          error: "",
        }
      } catch (error) {
        results.hmac = {
          success: false,
          message: "Failed to authenticate with HMAC",
          error: error instanceof Error ? error.message : "Unknown error",
        }
      }
    } else {
      results.hmac = {
        success: false,
        message: "API secret not configured",
        error: "",
      }
    }

    return NextResponse.json({
      success: true,
      results,
      recommendedMethod: results.jwt.success ? "JWT" : results.hmac.success ? "HMAC" : "None",
    })
  } catch (error) {
    console.error("Error testing authentication methods:", error)
    return NextResponse.json({
      success: false,
      message: "Error testing authentication methods",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
