import crypto from "crypto"

// Types to replace the SDK types
export type Account = {
  id: string
  name: string
  currency: string
  available_balance: { value: string; currency: string }
  hold: { value: string; currency: string }
}

export type Product = {
  product_id: string
  price: string
  price_percentage_change_24h: string
  volume_24h: string
  status: string
  quote_currency_id: string
  base_currency_id: string
}

export type Order = {
  order_id: string
  product_id: string
  side: string
  status: string
  time_in_force: string
  created_time: string
  completion_time?: string
  filled_size?: string
  filled_value?: string
  average_filled_price?: string
}

// Initialize the Coinbase API client with direct fetch calls
export function getCoinbaseClient() {
  const apiKey = process.env.COINBASE_API_KEY
  const apiSecret = process.env.COINBASE_API_SECRET

  if (!apiKey || !apiSecret) {
    throw new Error("Coinbase API credentials not configured")
  }

  return {
    apiKey,
    apiSecret,
  }
}

// Helper function to make authenticated requests to Coinbase API
async function makeAuthenticatedRequest(method: string, path: string, body?: any) {
  const { apiKey, apiSecret } = getCoinbaseClient()

  const timestamp = Math.floor(Date.now() / 1000).toString()
  const requestPath = path.startsWith("/") ? path : `/${path}`

  // Create the message to sign
  const message = timestamp + method + requestPath + (body ? JSON.stringify(body) : "")

  // Create the signature
  const signature = crypto.createHmac("sha256", apiSecret).update(message).digest("hex")

  // Make the request
  const response = await fetch(`https://api.exchange.coinbase.com${requestPath}`, {
    method,
    headers: {
      "CB-ACCESS-KEY": apiKey,
      "CB-ACCESS-SIGN": signature,
      "CB-ACCESS-TIMESTAMP": timestamp,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Coinbase API error: ${response.status} ${response.statusText}. Details: ${errorText}`)
  }

  return await response.json()
}

// Get account details
export async function getAccounts() {
  try {
    const response = await makeAuthenticatedRequest("GET", "/api/v3/brokerage/accounts")
    return response
  } catch (error) {
    console.error("Error fetching accounts:", error)
    throw error
  }
}

// Get product information
export async function getProducts() {
  try {
    const response = await makeAuthenticatedRequest("GET", "/api/v3/brokerage/products")
    return response
  } catch (error) {
    console.error("Error fetching products:", error)
    throw error
  }
}

// Get specific product
export async function getProduct(productId: string) {
  try {
    const response = await makeAuthenticatedRequest("GET", `/api/v3/brokerage/products/${productId}`)
    return response
  } catch (error) {
    console.error(`Error fetching product ${productId}:`, error)
    throw error
  }
}

// Get product ticker
export async function getProductTicker(productId: string) {
  try {
    const response = await makeAuthenticatedRequest("GET", `/api/v3/brokerage/products/${productId}/ticker`)
    return response
  } catch (error) {
    console.error(`Error fetching ticker for ${productId}:`, error)
    throw error
  }
}

// Get open orders
export async function getOpenOrders() {
  try {
    const response = await makeAuthenticatedRequest("GET", "/api/v3/brokerage/orders/historical?status=OPEN")
    return response
  } catch (error) {
    console.error("Error fetching open orders:", error)
    throw error
  }
}

// Place a market order
export async function placeMarketOrder(productId: string, side: "BUY" | "SELL", size: string, isSizeInQuote = false) {
  try {
    // Generate a unique client order ID
    const clientOrderId = `super777-${Date.now()}-${Math.floor(Math.random() * 1000)}`

    // Create order configuration based on whether size is in base or quote currency
    const orderConfiguration = isSizeInQuote
      ? { market_market_ioc: { quote_size: size } }
      : { market_market_ioc: { base_size: size } }

    const payload = {
      client_order_id: clientOrderId,
      product_id: productId,
      side: side,
      order_configuration: orderConfiguration,
    }

    const response = await makeAuthenticatedRequest("POST", "/api/v3/brokerage/orders", payload)
    return response
  } catch (error) {
    console.error(`Error placing ${side} order for ${productId}:`, error)
    throw error
  }
}

// Get historical candles
export async function getCandles(productId: string, granularity: string, start?: string, end?: string) {
  try {
    let path = `/api/v3/brokerage/products/${productId}/candles?granularity=${granularity}`

    if (start) path += `&start=${start}`
    if (end) path += `&end=${end}`

    const response = await makeAuthenticatedRequest("GET", path)
    return response
  } catch (error) {
    console.error(`Error fetching candles for ${productId}:`, error)
    throw error
  }
}

// Test API connection
export async function testConnection() {
  try {
    const response = await makeAuthenticatedRequest("GET", "/api/v3/brokerage/products")

    return {
      success: true,
      message: "Successfully connected to Coinbase API",
      productsCount: response.products?.length || 0,
    }
  } catch (error) {
    console.error("Error testing Coinbase connection:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error connecting to Coinbase API",
    }
  }
}
