import { NextResponse } from "next/server"
import crypto from "crypto"

export async function GET() {
  try {
    // Check if API keys are configured
    const apiKey = process.env.COINBASE_API_KEY
    const apiSecret = process.env.COINBASE_API_SECRET
    const privateKey = process.env.COINBASE_PRIVATE_KEY

    // Prepare response data
    const credentialStatus = {
      apiKey: {
        configured: !!apiKey,
        value: apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : null,
      },
      apiSecret: {
        configured: !!apiSecret,
        value: apiSecret ? `${apiSecret.substring(0, 4)}...` : null,
      },
      privateKey: {
        configured: !!privateKey,
        format: privateKey ? (privateKey.includes("BEGIN PRIVATE KEY") ? "PKCS#8" : "Unknown") : null,
      },
      recommendedAuth: null as string | null,
    }

    // Determine recommended authentication method
    if (apiKey && apiSecret) {
      credentialStatus.recommendedAuth = "HMAC"
    } else if (apiKey && privateKey && privateKey.includes("BEGIN PRIVATE KEY")) {
      credentialStatus.recommendedAuth = "JWT"
    } else if (apiKey) {
      credentialStatus.recommendedAuth = "HMAC (but missing API Secret)"
    } else {
      credentialStatus.recommendedAuth = null
    }

    // Test API connection if credentials are available
    let connectionTest = { success: false, message: "API credentials not configured", details: null }

    if (apiKey && apiSecret) {
      try {
        // Test HMAC authentication
        const timestamp = Math.floor(Date.now() / 1000).toString()
        const method = "GET"
        const requestPath = "/api/v3/brokerage/accounts"
        const message = timestamp + method + requestPath
        const signature = crypto.createHmac("sha256", apiSecret).update(message).digest("hex")

        const response = await fetch(`https://api.exchange.coinbase.com${requestPath}`, {
          method,
          headers: {
            "Content-Type": "application/json",
            "CB-ACCESS-KEY": apiKey,
            "CB-ACCESS-SIGN": signature,
            "CB-ACCESS-TIMESTAMP": timestamp,
          },
        })

        if (response.ok) {
          const data = await response.json()
          connectionTest = {
            success: true,
            message: "Successfully connected to Coinbase API using HMAC authentication",
            details: {
              accountsCount: data.accounts?.length || 0,
            },
          }
        } else {
          const errorText = await response.text()
          connectionTest = {
            success: false,
            message: `Coinbase API error: ${response.status} ${response.statusText}`,
            details: errorText.substring(0, 200),
          }
        }
      } catch (error) {
        connectionTest = {
          success: false,
          message: error instanceof Error ? error.message : "Unknown error connecting to Coinbase API",
          details: null,
        }
      }
    }

    return NextResponse.json({
      success: true,
      credentialStatus,
      connectionTest,
      recommendations: getRecommendations(credentialStatus, connectionTest),
    })
  } catch (error) {
    console.error("Error checking credentials:", error)
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : "Unknown error checking credentials",
    })
  }
}

// Helper function to generate recommendations based on credential status
function getRecommendations(credentialStatus: any, connectionTest: any) {
  const recommendations = []

  if (!credentialStatus.apiKey.configured) {
    recommendations.push({
      priority: "high",
      message: "Add your Coinbase API Key to the environment variables",
      details: "Set COINBASE_API_KEY in your Vercel environment variables",
    })
  }

  if (!credentialStatus.apiSecret.configured) {
    recommendations.push({
      priority: "high",
      message: "Add your Coinbase API Secret to the environment variables",
      details: "Set COINBASE_API_SECRET in your Vercel environment variables",
    })
  }

  if (credentialStatus.privateKey.configured && credentialStatus.privateKey.format !== "PKCS#8") {
    recommendations.push({
      priority: "medium",
      message: "Your private key is not in PKCS#8 format",
      details: "Convert your private key to PKCS#8 format or use HMAC authentication instead",
    })
  }

  if (credentialStatus.apiKey.configured && credentialStatus.apiSecret.configured && !connectionTest.success) {
    recommendations.push({
      priority: "high",
      message: "API connection test failed",
      details: connectionTest.message,
    })
  }

  return recommendations
}
