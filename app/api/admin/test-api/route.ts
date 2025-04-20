import { NextResponse } from "next/server"
import crypto from "crypto"
import { SignJWT, importPKCS8 } from "jose"

export async function POST(request: Request) {
  try {
    // Parse the request body
    const body = await request.json()
    const { authType, apiKeyId, privateKey, apiSecret, endpoint, method, body: requestBody } = body

    // Validate required fields
    if (!apiKeyId || (!privateKey && !apiSecret) || !endpoint || !method) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Make the API request based on authentication type
    if (authType === "jwt") {
      return await testJwtAuth(apiKeyId, privateKey, endpoint, method, requestBody)
    } else if (authType === "hmac") {
      return await testHmacAuth(apiKeyId, apiSecret, endpoint, method, requestBody)
    } else {
      return NextResponse.json({ error: "Invalid authentication type" }, { status: 400 })
    }
  } catch (error) {
    console.error("Error in test-api route:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

// Test JWT authentication
async function testJwtAuth(apiKeyId: string, privateKey: string, endpoint: string, method: string, body?: any) {
  try {
    // Ensure the endpoint starts with a slash
    const requestPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

    // Current timestamp in seconds
    const timestamp = Math.floor(Date.now() / 1000)

    // Create the message to sign
    const message = timestamp + method + requestPath + (body ? JSON.stringify(body) : "")

    // Import the private key using jose
    const privateKeyObj = await importPKCS8(privateKey, "ES256")

    // Create a JWT token
    const jwt = await new SignJWT({
      sub: apiKeyId,
      iat: timestamp,
      exp: timestamp + 60, // Token expires in 60 seconds
      message: message,
    })
      .setProtectedHeader({ alg: "ES256", typ: "JWT" })
      .sign(privateKeyObj)

    // Make the request
    const response = await fetch(`https://api.exchange.coinbase.com${requestPath}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "CB-ACCESS-KEY": apiKeyId,
        "CB-ACCESS-TIMESTAMP": timestamp.toString(),
        "CB-ACCESS-JWT": jwt,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    // Get response details
    const responseStatus = response.status
    const responseStatusText = response.statusText
    let responseData

    try {
      responseData = await response.json()
    } catch (e) {
      const text = await response.text()
      responseData = { text }
    }

    return NextResponse.json({
      success: response.ok,
      status: responseStatus,
      statusText: responseStatusText,
      data: responseData,
      requestDetails: {
        url: `https://api.exchange.coinbase.com${requestPath}`,
        method,
        authType: "JWT",
        timestamp,
      },
    })
  } catch (error) {
    console.error("Error testing JWT auth:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}

// Test HMAC authentication
async function testHmacAuth(apiKey: string, apiSecret: string, endpoint: string, method: string, body?: any) {
  try {
    // Ensure the endpoint starts with a slash
    const requestPath = endpoint.startsWith("/") ? endpoint : `/${endpoint}`

    // Current timestamp in seconds
    const timestamp = Math.floor(Date.now() / 1000).toString()

    // Create the message to sign
    const message = timestamp + method + requestPath + (body ? JSON.stringify(body) : "")

    // Create the signature using Web Crypto API
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(apiSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    )

    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(message))

    // Convert to hex string
    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

    // Make the request
    const response = await fetch(`https://api.exchange.coinbase.com${requestPath}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "CB-ACCESS-KEY": apiKey,
        "CB-ACCESS-SIGN": signature,
        "CB-ACCESS-TIMESTAMP": timestamp,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    // Get response details
    const responseStatus = response.status
    const responseStatusText = response.statusText
    let responseData

    try {
      responseData = await response.json()
    } catch (e) {
      const text = await response.text()
      responseData = { text }
    }

    return NextResponse.json({
      success: response.ok,
      status: responseStatus,
      statusText: responseStatusText,
      data: responseData,
      requestDetails: {
        url: `https://api.exchange.coinbase.com${requestPath}`,
        method,
        authType: "HMAC",
        timestamp,
      },
    })
  } catch (error) {
    console.error("Error testing HMAC auth:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 },
    )
  }
}
