import { OrderSide } from "@/lib/trading-service"
import { monitoring } from "@/lib/monitoring-service"

/**
 * Utility for safely testing trading functionality with minimal risk
 */
export class TestUtils {
  /**
   * Execute a small test trade to verify API connectivity and order execution
   * @param productId The trading pair to test (e.g., BTC-USD)
   * @param side Buy or sell
   * @param maxValue Maximum USD value to risk in the test
   * @returns Test result with order details if successful
   */
  public static async executeTestTrade(productId = "BTC-USD", side: OrderSide = OrderSide.BUY, maxValue = 10) {
    try {
      monitoring.info(`Starting test trade: ${side} ${productId} (max $${maxValue})`)

      // 1. Get current price for the product
      const ticker = await fetch(`/api/product-ticker?productId=${productId}`).then((res) => res.json())

      if (!ticker.success) {
        throw new Error(`Failed to get ticker: ${ticker.message}`)
      }

      const currentPrice = Number.parseFloat(ticker.data.price)
      monitoring.info(`Current ${productId} price: $${currentPrice}`)

      // 2. Calculate a very small quantity based on maxValue
      // Use 1/100th of maxValue to be extra safe
      const safeValue = maxValue / 100
      const quantity = (safeValue / currentPrice).toFixed(8)

      monitoring.info(`Calculated test quantity: ${quantity} (value ≈ $${safeValue})`)

      // 3. Execute the trade with simulation flag for extra safety
      const response = await fetch("/api/test-trade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          side,
          quantity,
          simulation: true, // Start with simulation mode
        }),
      }).then((res) => res.json())

      monitoring.info(`Test trade result:`, response)

      return {
        success: response.success,
        message: response.message,
        orderId: response.orderId,
        details: response,
        isSimulation: response.simulation || true,
      }
    } catch (error) {
      monitoring.error(`Test trade failed:`, error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error during test trade",
        isSimulation: true,
      }
    }
  }

  /**
   * Verify account access and permissions without placing orders
   */
  public static async verifyAccountAccess() {
    try {
      monitoring.info("Verifying account access and permissions")

      // 1. Check API connectivity
      const connectionTest = await fetch("/api/connection-test").then((res) => res.json())

      if (!connectionTest.success) {
        throw new Error(`Connection test failed: ${connectionTest.message}`)
      }

      // 2. Check account balances
      const balances = await fetch("/api/account-balances").then((res) => res.json())

      if (!balances.success) {
        throw new Error(`Failed to get account balances: ${balances.message}`)
      }

      // 3. Check trading permissions by attempting to get open orders
      const orders = await fetch("/api/open-orders").then((res) => res.json())

      return {
        success: true,
        message: "Account access and permissions verified successfully",
        hasViewPermissions: connectionTest.success,
        hasTradePermissions: orders.success,
        balances: balances.data,
      }
    } catch (error) {
      monitoring.error("Account verification failed:", error)
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error during account verification",
      }
    }
  }
}
