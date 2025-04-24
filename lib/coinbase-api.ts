import { makeJwtAuthenticatedRequest } from "./coinbase-jwt"
import { monitoring } from "@/lib/monitoring-service"

// Define a custom error class for Coinbase API errors
export class CoinbaseAPIError extends Error {
  type: string
  constructor(message: string, type: string) {
    super(message)
    this.name = "CoinbaseAPIError"
    this.type = type
  }
}

// Retry configuration
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

// Helper function to add retry logic to API calls
async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES, delay = RETRY_DELAY_MS): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    // Don't retry on authentication errors
    if (error instanceof CoinbaseAPIError && (error.type === "InvalidCredentials" || error.type.includes("auth"))) {
      throw error
    }

    // Don't retry if we've exhausted our retries
    if (retries <= 0) {
      throw error
    }

    // Log retry attempt
    monitoring.warn("Coinbase API call failed, retrying...", {
      error: error instanceof Error ? error.message : "Unknown error",
      retriesLeft: retries - 1,
    })

    // Wait before retrying
    await new Promise((resolve) => setTimeout(resolve, delay))

    // Exponential backoff
    return withRetry(fn, retries - 1, delay * 2)
  }
}

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

// Get account details with retry logic
export async function getAccounts() {
  return withRetry(async () => {
    try {
      return await makeJwtAuthenticatedRequest("GET", "/api/v3/brokerage/accounts")
    } catch (error) {
      console.error("Error fetching accounts:", error)
      throw error
    }
  })
}

// Get product information with retry logic
export async function getProducts() {
  return withRetry(async () => {
    try {
      return await makeJwtAuthenticatedRequest("GET", "/api/v3/brokerage/products")
    } catch (error) {
      console.error("Error fetching products:", error)
      throw error
    }
  })
}

// Get specific product with retry logic
export async function getProduct(productId: string) {
  return withRetry(async () => {
    try {
      return await makeJwtAuthenticatedRequest("GET", `/api/v3/brokerage/products/${productId}`)
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error)
      throw error
    }
  })
}

// Get product ticker with retry logic
export async function getProductTicker(productId: string) {
  return withRetry(async () => {
    try {
      return await makeJwtAuthenticatedRequest("GET", `/api/v3/brokerage/products/${productId}/ticker`)
    } catch (error) {
      console.error(`Error fetching ticker for ${productId}:`, error)
      throw error
    }
  })
}

// Get open orders with retry logic
export async function getOpenOrders() {
  return withRetry(async () => {
    try {
      return await makeJwtAuthenticatedRequest("GET", "/api/v3/brokerage/orders/historical?status=OPEN")
    } catch (error) {
      console.error("Error fetching open orders:", error)
      throw error
    }
  })
}

// Place a market order with retry logic (but only retry safe operations)
export async function placeMarketOrder(productId: string, side: "BUY" | "SELL", size: string, isSizeInQuote = false) {
  // Don't retry order placement to avoid duplicate orders
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

    monitoring.info(`Placing ${side} order for ${productId}`, { size, isSizeInQuote })
    const response = await makeJwtAuthenticatedRequest("POST", "/api/v3/brokerage/orders", payload)

    // Log successful order
    monitoring.info(`Successfully placed ${side} order for ${productId}`, {
      orderId: response.order_id,
      status: response.status,
    })

    return response
  } catch (error) {
    console.error(`Error placing ${side} order for ${productId}:`, error)
    monitoring.error(`Failed to place ${side} order for ${productId}`, {
      error: error instanceof Error ? error.message : "Unknown error",
      size,
      isSizeInQuote,
    })
    throw error
  }
}

// Get historical candles with retry logic
export async function getCandles(productId: string, granularity: string, start?: string, end?: string) {
  return withRetry(async () => {
    try {
      let path = `/api/v3/brokerage/products/${productId}/candles?granularity=${granularity}`

      if (start) path += `&start=${start}`
      if (end) path += `&end=${end}`

      return await makeJwtAuthenticatedRequest("GET", path)
    } catch (error) {
      console.error(`Error fetching candles for ${productId}:`, error)
      throw error
    }
  })
}

// Test API connection with retry logic
export async function testConnection() {
  return withRetry(async () => {
    try {
      const response = await makeJwtAuthenticatedRequest("GET", "/api/v3/brokerage/products")
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
  })
}

// Function to execute an order with improved error handling
export async function executeOrder(orderParams: {
  side: string
  product_id: string
  size: string
  type?: string
  price?: string
  time_in_force?: string
}) {
  try {
    const { side, product_id, size, type = "market", price, time_in_force = "IOC" } = orderParams

    // Validate required parameters
    if (!side || !product_id || !size) {
      throw new Error("Missing required parameters: side, product_id, and size")
    }

    // Log the order attempt
    monitoring.info(`Executing ${side} order for ${product_id}`, {
      size,
      type,
      price: price || "market",
    })

    // Construct the order payload
    const payload: any = {
      client_order_id: `super777-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      product_id: product_id,
      side: side.toUpperCase(),
    }

    if (type === "market") {
      payload.order_configuration = {
        market_market_ioc: {
          base_size: size,
        },
      }
    } else if (type === "limit" && price) {
      payload.order_configuration = {
        limit_limit_gtc: {
          base_size: size,
          limit_price: price,
          post_only: false,
        },
      }
    } else {
      throw new Error("Invalid order type or missing price for limit order")
    }

    const response = await makeJwtAuthenticatedRequest("POST", "/api/v3/brokerage/orders", payload)

    // Log the successful order
    monitoring.info(`Order executed successfully`, {
      orderId: response.order_id,
      status: response.status,
    })

    // Return the order details
    return {
      orderId: response.order_id,
      status: response.status,
      productId: product_id,
      side: side,
      size: size,
      type: type,
      price: price,
      time_in_force: time_in_force,
    }
  } catch (error) {
    console.error("Error executing order:", error)
    monitoring.error("Failed to execute order", {
      error: error instanceof Error ? error.message : "Unknown error",
      orderParams,
    })
    throw error
  }
}

// Add this function to generate mock position data
function getMockPositions() {
  return [
    {
      productId: "BTC-USD",
      size: "0.12",
      entryPrice: "42150.75",
      markPrice: "43250.5",
      pnl: "131.97",
      pnlPercentage: "2.61",
      timestamp: new Date().toISOString(),
    },
    {
      productId: "ETH-USD",
      size: "1.5",
      entryPrice: "2250.25",
      markPrice: "2310.75",
      pnl: "90.75",
      pnlPercentage: "2.69",
      timestamp: new Date().toISOString(),
    },
    {
      productId: "XRP-USD",
      size: "1500",
      entryPrice: "0.62",
      markPrice: "0.59",
      pnl: "-45.0",
      pnlPercentage: "-4.84",
      timestamp: new Date().toISOString(),
    },
  ]
}

export async function makeHmacAuthenticatedRequest<T>(method: string, path: string, body?: any): Promise<T> {
  throw new Error("makeHmacAuthenticatedRequest is not implemented")
}
