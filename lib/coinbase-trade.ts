import { executeOrder } from "@/lib/coinbase-api"

// Function to execute trades on Coinbase
export async function executeCoinbaseTrade(ticker: string, action: string, quantity: string) {
  try {
    console.log(`Executing Coinbase trade: ${action} ${quantity} of ${ticker}`)

    // Format the ticker if needed (e.g., convert BTCUSD to BTC-USD)
    const productId = formatTicker(ticker)

    // Execute the trade using our existing Coinbase API integration
    const tradeResult = await executeOrder({
      product_id: productId,
      side: action.toLowerCase(), // buy or sell
      size: quantity.toString(),
      type: "market",
    })

    console.log("Trade executed successfully:", tradeResult)
    return tradeResult
  } catch (error) {
    console.error("Coinbase trade error:", error)
    return { error: error instanceof Error ? error.message : "Unknown error" }
  }
}

// Helper function to format ticker symbols for Coinbase
function formatTicker(ticker: string): string {
  // If ticker already has a dash (e.g., BTC-USD), return as is
  if (ticker.includes("-")) return ticker

  // Handle common formats like BTCUSD
  if (/^[A-Z]{3,4}[A-Z]{3}$/.test(ticker)) {
    // Find the currency part (usually the last 3 characters)
    const baseCurrency = ticker.slice(0, -3)
    const quoteCurrency = ticker.slice(-3)
    return `${baseCurrency}-${quoteCurrency}`
  }

  // If we can't determine the format, return as is
  return ticker
}
