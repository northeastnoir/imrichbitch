import { SignJWT, importPKCS8 } from "jose"
import { monitoring } from "@/lib/monitoring-service"
import crypto from "crypto"

// Cache for JWT tokens to avoid regenerating them too frequently
const tokenCache: Record<string, { token: string; expires: number }> = {}

// Function to create a JWT token for Coinbase API
export async function generateCoinbaseJWT(method: string, requestPath: string, body?: any) {
  try {
    // Get API credentials from environment variables
    const apiKeyId = process.env.COINBASE_API_KEY
    let privateKeyPem = process.env.COINBASE_PRIVATE_KEY

    if (!apiKeyId) {
      throw new Error("Coinbase API key not configured")
    }

    // Check if we have a private key for JWT auth
    if (!privateKeyPem) {
      throw new Error("Coinbase private key not configured for JWT authentication")
    }

    // Current timestamp in seconds
    const timestamp = Math.floor(Date.now() / 1000)

    // Create the message to sign (same format as in the HMAC method)
    const message = timestamp + method + requestPath + (body ? JSON.stringify(body) : "")

    // Create a cache key
    const cacheKey = `${apiKeyId}:${message}`

    // Check if we have a valid cached token
    if (tokenCache[cacheKey] && tokenCache[cacheKey].expires > timestamp) {
      return tokenCache[cacheKey].token
    }

    try {
      // Convert literal "\n" strings to actual newlines
      if (privateKeyPem && privateKeyPem.includes("\\n")) {
        privateKeyPem = privateKeyPem.replace(/\\n/g, "\n")
      }

      // Import the private key using jose
      const privateKey = await importPKCS8(privateKeyPem, "ES256")

      // Create a JWT token
      const jwt = await new SignJWT({
        sub: apiKeyId,
        iat: timestamp,
        exp: timestamp + 60, // Token expires in 60 seconds
        message: message,
      })
        .setProtectedHeader({ alg: "ES256", typ: "JWT" })
        .sign(privateKey)

      // Cache the token
      tokenCache[cacheKey] = {
        token: jwt,
        expires: timestamp + 55, // Cache for slightly less than the token expiry
      }

      return jwt
    } catch (error) {
      monitoring.error("Failed to create Coinbase JWT", {
        error: error instanceof Error ? error.message : "Unknown error",
      })
      throw error
    }
  } catch (error) {
    console.error("Error creating Coinbase JWT:", error)
    monitoring.error("Failed to create Coinbase JWT", {
      error: error instanceof Error ? error.message : "Unknown error",
    })
    throw error
  }
}

// Function to make authenticated requests to Coinbase API using JWT or HMAC
export async function makeJwtAuthenticatedRequest<T>(method: string, path: string, body?: any): Promise<T> {
  try {
    // Get API credentials from environment variables
    const apiKeyId = process.env.COINBASE_API_KEY
    const apiSecret = process.env.COINBASE_API_SECRET
    let privateKeyPem = process.env.COINBASE_PRIVATE_KEY

    if (!apiKeyId) {
      throw new Error("Coinbase API key not configured")
    }

    // Current timestamp in seconds
    const timestamp = Math.floor(Date.now() / 1000).toString()

    // Prepare headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "CB-ACCESS-KEY": apiKeyId,
      "CB-ACCESS-TIMESTAMP": timestamp,
    }

    // Use HMAC authentication if API secret is available (prioritize this method)
    if (apiSecret) {
      const message = timestamp + method + path + (body ? JSON.stringify(body) : "")
      const signature = crypto.createHmac("sha256", apiSecret).update(message).digest("hex")
      headers["CB-ACCESS-SIGN"] = signature
    }
    // Only try JWT if HMAC is not available
    else if (privateKeyPem) {
      try {
        // Convert literal "\n" strings to actual newlines
        if (privateKeyPem && privateKeyPem.includes("\\n")) {
          privateKeyPem = privateKeyPem.replace(/\\n/g, "\n")
        }
        const jwt = await generateCoinbaseJWT(method, path, body)
        headers["CB-ACCESS-JWT"] = jwt
      } catch (jwtError) {
        console.warn("JWT authentication failed:", jwtError)
        monitoring.error("JWT creation failed", {
          error: jwtError instanceof Error ? jwtError.message : "Unknown error",
        })
        throw new Error("Authentication failed: " + (jwtError instanceof Error ? jwtError.message : "Unknown error"))
      }
    } else {
      throw new Error("No authentication method available - configure either API secret or private key")
    }

    // Make the request
    const response = await fetch(`https://api.exchange.coinbase.com${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorDetails
      try {
        errorDetails = JSON.parse(errorText)
      } catch (e) {
        errorDetails = errorText
      }

      console.error("Coinbase API error response:", {
        status: response.status,
        statusText: response.statusText,
        details: errorDetails,
      })

      monitoring.error("Coinbase API request failed", {
        status: response.status,
        path,
        details: errorDetails,
      })

      throw new Error(
        `Coinbase API error: ${response.status} ${response.statusText}. Details: ${typeof errorDetails === "object" ? JSON.stringify(errorDetails) : errorText}`,
      )
    }

    return (await response.json()) as T
  } catch (error) {
    console.error("Error making authenticated request:", error)
    monitoring.error("Authenticated request failed", {
      method,
      path,
      error: error instanceof Error ? error.message : "Unknown error",
    })
    throw error
  }
}

// Helper function for HMAC authentication
export async function makeHmacAuthenticatedRequest<T>(method: string, path: string, body?: any): Promise<T> {
  try {
    // Get API credentials
    const apiKey = process.env.COINBASE_API_KEY
    const apiSecret = process.env.COINBASE_API_SECRET

    if (!apiKey || !apiSecret) {
      throw new Error("Coinbase API credentials not configured for HMAC authentication")
    }

    // Current timestamp in seconds
    const timestamp = Math.floor(Date.now() / 1000).toString()

    // Create the message to sign
    const message = timestamp + method + path + (body ? JSON.stringify(body) : "")

    // Create the signature
    const signature = crypto.createHmac("sha256", apiSecret).update(message).digest("hex")

    // Make the request
    const response = await fetch(`https://api.exchange.coinbase.com${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "CB-ACCESS-KEY": apiKey,
        "CB-ACCESS-SIGN": signature,
        "CB-ACCESS-TIMESTAMP": timestamp,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Coinbase API error: ${response.status} ${response.statusText}. Details: ${errorText}`)
    }

    return (await response.json()) as T
  } catch (error) {
    console.error("Error making HMAC authenticated request:", error)
    monitoring.error("HMAC authenticated request failed", {
      method,
      path,
      error: error instanceof Error ? error.message : "Unknown error",
    })
    throw error
  }
}

export async function coinbaseRequest<T>(method: string, path: string, body?: any): Promise<T> {
  return makeJwtAuthenticatedRequest<T>(method, path, body)
}
