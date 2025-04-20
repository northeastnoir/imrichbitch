import { NextResponse } from "next/server"

export async function GET() {
  // Check if API keys are configured
  const apiKey = process.env.COINBASE_API_KEY
  const apiSecret = process.env.COINBASE_API_SECRET

  // Safely display partial credentials for debugging
  const safeApiKey = apiKey ? `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : "not set"
  const safeApiSecret = apiSecret
    ? `${apiSecret.substring(0, 4)}...${apiSecret.substring(apiSecret.length - 4)}`
    : "not set"

  return NextResponse.json({
    environment: process.env.NODE_ENV,
    credentialsConfigured: {
      apiKey: !!apiKey,
      apiSecret: !!apiSecret,
      webhookSecret: !!process.env.WEBHOOK_SECRET,
    },
    partialCredentials: {
      apiKey: safeApiKey,
      apiSecret: safeApiSecret,
    },
    timestamp: new Date().toISOString(),
  })
}
