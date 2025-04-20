import { NextResponse } from "next/server"
import { getAccounts, getOpenOrders, getProductTicker } from "@/lib/coinbase-api"
import { monitoring } from "@/lib/monitoring-service"

// Cache for positions data
let positionsCache: {
  data: any[]
  timestamp: number
  isMockData: boolean
} | null = null

// Cache duration in milliseconds (1 minute)
const CACHE_DURATION = 60 * 1000

export async function GET() {
  try {
    // Check if we have fresh cached data
    if (positionsCache && Date.now() - positionsCache.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        success: true,
        positions: positionsCache.data,
        isMockData: positionsCache.isMockData,
        fromCache: true,
        timestamp: new Date().toISOString(),
      })
    }

    // Check if API keys are configured
    const apiKey = process.env.COINBASE_API_KEY
    const apiSecret = process.env.COINBASE_API_SECRET

    if (!apiKey || !apiSecret) {
      console.log("API credentials not configured, returning mock data")
      const mockData = getMockPositions()

      // Cache the mock data
      positionsCache = {
        data: mockData,
        timestamp: Date.now(),
        isMockData: true,
      }

      // Return mock data if API keys are not configured
      return NextResponse.json({
        success: true,
        positions: mockData,
        isMockData: true,
        message: "Using mock data - Coinbase API credentials not configured",
        timestamp: new Date().toISOString(),
      })
    }

    console.log("API credentials found, attempting to fetch account balances")

    try {
      // Set a timeout for the entire operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Operation timed out after 8 seconds")), 8000)
      })

      // Get account balances and open orders in parallel
      const [accountsResponse, ordersResponse] = (await Promise.race([
        Promise.all([getAccounts(), getOpenOrders()]),
        timeoutPromise,
      ])) as [any, any]

      const accounts = accountsResponse.accounts || []
      const openOrders = ordersResponse.orders || []

      console.log("Successfully fetched account balances and open orders, processing positions")

      // Filter accounts with non-zero balances
      const activeAccounts = accounts.filter(
        (account) =>
          Number.parseFloat(account.available_balance.value) > 0 || Number.parseFloat(account.hold.value) > 0,
      )

      // Create positions array
      const positionsPromises = activeAccounts.map(async (account) => {
        // Skip USD and stablecoins
        if (account.currency === "USD" || account.currency === "USDC" || account.currency === "USDT") {
          return null
        }

        const quantity = Number.parseFloat(account.available_balance.value) + Number.parseFloat(account.hold.value)
        if (quantity <= 0) return null

        // Get current price
        const productId = `${account.currency}-USD`
        let currentPrice = 0
        let entryPrice = 0

        try {
          const ticker = await getProductTicker(productId)
          currentPrice = Number.parseFloat(ticker.price || "0")

          // Estimate entry price from open orders or use current price as fallback
          const pairOrders = openOrders.filter((order) => order.product_id === productId)
          if (pairOrders.length > 0) {
            // Use the average price of open orders as a rough estimate
            const totalPrice = pairOrders.reduce((sum, order) => {
              const price = Number.parseFloat(order.average_filled_price || "0")
              const size = Number.parseFloat(order.filled_size || "0")
              return sum + price * size
            }, 0)
            const totalSize = pairOrders.reduce((sum, order) => sum + Number.parseFloat(order.filled_size || "0"), 0)
            entryPrice = totalSize > 0 ? totalPrice / totalSize : currentPrice
          } else {
            // No open orders, use current price as fallback
            entryPrice = currentPrice * 0.98 // Assume 2% lower as a placeholder
          }
        } catch (error) {
          console.error(`Error getting price for ${productId}:`, error)
          return null
        }

        const value = quantity * currentPrice
        const estimatedCost = quantity * entryPrice
        const pnlValue = value - estimatedCost
        const pnlPercentage = (pnlValue / estimatedCost) * 100

        return {
          pair: productId,
          entryPrice,
          currentPrice,
          quantity,
          value,
          pnlPercentage,
          pnlValue,
          timestamp: new Date().toISOString(),
        }
      })

      // Wait for all position calculations with a timeout
      const positions = (await Promise.race([
        Promise.all(positionsPromises),
        new Promise((_, reject) => setTimeout(() => reject(new Error("Positions calculation timed out")), 5000)),
      ])) as any[]

      // Filter out null values and sort by value (descending)
      const validPositions = positions
        .filter((position) => position !== null)
        .sort((a: any, b: any) => b.value - a.value)

      console.log(`Successfully processed ${validPositions.length} positions`)

      // Cache the positions
      positionsCache = {
        data: validPositions,
        timestamp: Date.now(),
        isMockData: false,
      }

      return NextResponse.json({
        success: true,
        positions: validPositions,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Error fetching active positions:", error)
      monitoring.error("Failed to fetch active positions", {
        error: error instanceof Error ? error.message : "Unknown error",
      })

      // Check if it's an authentication error
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      const isAuthError =
        errorMessage.includes("auth") ||
        errorMessage.includes("API key") ||
        errorMessage.includes("credentials") ||
        errorMessage.includes("Authentication")

      console.log(`Returning mock data due to error: ${isAuthError ? "Authentication error" : errorMessage}`)

      const mockData = getMockPositions()

      // Cache the mock data
      positionsCache = {
        data: mockData,
        timestamp: Date.now(),
        isMockData: true,
      }

      // Return mock data with appropriate message
      return NextResponse.json({
        success: true,
        positions: mockData,
        isMockData: true,
        message: isAuthError
          ? "Using mock data - Invalid API credentials. Please check your Coinbase API key and secret in your Vercel environment variables."
          : `Using mock data - ${errorMessage}`,
        timestamp: new Date().toISOString(),
      })
    }
  } catch (error) {
    console.error("Error in active positions route:", error)
    monitoring.error("Error in positions API", {
      error: error instanceof Error ? error.message : "Unknown error",
    })

    const mockData = getMockPositions()

    return NextResponse.json({
      success: true,
      positions: mockData,
      isMockData: true,
      message: "Using mock data due to server error",
      error: error instanceof Error ? error.message : "Unknown error fetching positions",
      timestamp: new Date().toISOString(),
    })
  }
}

// Add this function to generate mock position data
function getMockPositions() {
  return [
    {
      pair: "BTC-USD",
      entryPrice: 42150.75,
      currentPrice: 43250.5,
      quantity: 0.12,
      value: 5190.06,
      pnlPercentage: 2.61,
      pnlValue: 131.97,
      timestamp: new Date().toISOString(),
    },
    {
      pair: "ETH-USD",
      entryPrice: 2250.25,
      currentPrice: 2310.75,
      quantity: 1.5,
      value: 3466.13,
      pnlPercentage: 2.69,
      pnlValue: 90.75,
      timestamp: new Date().toISOString(),
    },
    {
      pair: "XRP-USD",
      entryPrice: 0.62,
      currentPrice: 0.59,
      quantity: 1500,
      value: 885.0,
      pnlPercentage: -4.84,
      pnlValue: -45.0,
      timestamp: new Date().toISOString(),
    },
  ]
}
