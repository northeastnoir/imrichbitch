import { coinbaseRequest } from "./coinbase-jwt"
import { CoinbaseAPIError } from "./coinbase-api"

// Trading service error types
export enum TradingErrorType {
  AUTHENTICATION = "authentication_error",
  INSUFFICIENT_FUNDS = "insufficient_funds",
  INVALID_ORDER = "invalid_order",
  RATE_LIMIT = "rate_limit",
  SERVER_ERROR = "server_error",
  UNKNOWN = "unknown_error",
}

// Trading service error
export class TradingError extends Error {
  type: TradingErrorType
  details?: any

  constructor(message: string, type: TradingErrorType, details?: any) {
    super(message)
    this.name = "TradingError"
    this.type = type
    this.details = details
  }
}

// Order types
export enum OrderType {
  MARKET = "MARKET",
  LIMIT = "LIMIT",
  STOP = "STOP",
  STOP_LIMIT = "STOP_LIMIT",
}

// Order side
export enum OrderSide {
  BUY = "BUY",
  SELL = "SELL",
}

// Time in force
export enum TimeInForce {
  GOOD_TILL_CANCELLED = "GTC",
  GOOD_TILL_TIME = "GTT",
  IMMEDIATE_OR_CANCEL = "IOC",
  FILL_OR_KILL = "FOK",
}

// Order request
export interface OrderRequest {
  productId: string
  side: OrderSide
  orderType: OrderType
  size?: string // Base currency amount
  funds?: string // Quote currency amount
  limitPrice?: string // Required for LIMIT and STOP_LIMIT orders
  stopPrice?: string // Required for STOP and STOP_LIMIT orders
  timeInForce?: TimeInForce
  clientOrderId?: string // Optional client-defined order ID
  stp?: string // Self-trade prevention flag
}

// Order response
export interface OrderResponse {
  orderId: string
  productId: string
  side: OrderSide
  orderType: OrderType
  size?: string
  funds?: string
  limitPrice?: string
  stopPrice?: string
  status: string
  filledSize: string
  filledValue: string
  createdAt: string
  completedAt?: string
}

// Position
export interface Position {
  productId: string
  size: string
  entryPrice: string
  markPrice: string
  pnl: string
  pnlPercentage: string
  liquidationPrice?: string
  createdAt: string
  updatedAt: string
}

/**
 * Trading service for executing trades and managing positions
 */
export class TradingService {
  /**
   * Create a market order
   * @param productId Product ID (e.g., BTC-USD)
   * @param side Order side (BUY or SELL)
   * @param size Base currency amount (e.g., 0.1 BTC)
   * @param funds Quote currency amount (e.g., 5000 USD)
   * @returns Order response
   */
  public static async createMarketOrder(
    productId: string,
    side: OrderSide,
    size?: string,
    funds?: string,
  ): Promise<OrderResponse> {
    if (!size && !funds) {
      throw new TradingError("Either size or funds must be specified for market orders", TradingErrorType.INVALID_ORDER)
    }

    return this.createOrder({
      productId,
      side,
      orderType: OrderType.MARKET,
      size,
      funds,
    })
  }

  /**
   * Create a limit order
   * @param productId Product ID (e.g., BTC-USD)
   * @param side Order side (BUY or SELL)
   * @param size Base currency amount (e.g., 0.1 BTC)
   * @param limitPrice Limit price (e.g., 50000)
   * @param timeInForce Time in force (default: GTC)
   * @returns Order response
   */
  public static async createLimitOrder(
    productId: string,
    side: OrderSide,
    size: string,
    limitPrice: string,
    timeInForce: TimeInForce = TimeInForce.GOOD_TILL_CANCELLED,
  ): Promise<OrderResponse> {
    return this.createOrder({
      productId,
      side,
      orderType: OrderType.LIMIT,
      size,
      limitPrice,
      timeInForce,
    })
  }

  /**
   * Create a stop order
   * @param productId Product ID (e.g., BTC-USD)
   * @param side Order side (BUY or SELL)
   * @param size Base currency amount (e.g., 0.1 BTC)
   * @param stopPrice Stop price (e.g., 45000)
   * @param timeInForce Time in force (default: GTC)
   * @returns Order response
   */
  public static async createStopOrder(
    productId: string,
    side: OrderSide,
    size: string,
    stopPrice: string,
    timeInForce: TimeInForce = TimeInForce.GOOD_TILL_CANCELLED,
  ): Promise<OrderResponse> {
    return this.createOrder({
      productId,
      side,
      orderType: OrderType.STOP,
      size,
      stopPrice,
      timeInForce,
    })
  }

  /**
   * Create a stop-limit order
   * @param productId Product ID (e.g., BTC-USD)
   * @param side Order side (BUY or SELL)
   * @param size Base currency amount (e.g., 0.1 BTC)
   * @param stopPrice Stop price (e.g., 45000)
   * @param limitPrice Limit price (e.g., 44900)
   * @param timeInForce Time in force (default: GTC)
   * @returns Order response
   */
  public static async createStopLimitOrder(
    productId: string,
    side: OrderSide,
    size: string,
    stopPrice: string,
    limitPrice: string,
    timeInForce: TimeInForce = TimeInForce.GOOD_TILL_CANCELLED,
  ): Promise<OrderResponse> {
    return this.createOrder({
      productId,
      side,
      orderType: OrderType.STOP_LIMIT,
      size,
      stopPrice,
      limitPrice,
      timeInForce,
    })
  }

  /**
   * Create an order
   * @param orderRequest Order request
   * @returns Order response
   */
  public static async createOrder(orderRequest: OrderRequest): Promise<OrderResponse> {
    try {
      // Generate a client order ID if not provided
      if (!orderRequest.clientOrderId) {
        orderRequest.clientOrderId = `super777-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      }

      // Prepare the request payload
      const payload: any = {
        product_id: orderRequest.productId,
        side: orderRequest.side,
        client_order_id: orderRequest.clientOrderId,
      }

      // Set order type and configuration based on order type
      switch (orderRequest.orderType) {
        case OrderType.MARKET:
          if (orderRequest.size) {
            payload.order_configuration = {
              market_market_ioc: {
                base_size: orderRequest.size,
              },
            }
          } else if (orderRequest.funds) {
            payload.order_configuration = {
              market_market_ioc: {
                quote_size: orderRequest.funds,
              },
            }
          }
          break

        case OrderType.LIMIT:
          payload.order_configuration = {
            limit_limit_gtc: {
              base_size: orderRequest.size,
              limit_price: orderRequest.limitPrice,
              post_only: false,
            },
          }
          break

        case OrderType.STOP:
          payload.order_configuration = {
            stop_limit_stop_limit_gtc: {
              base_size: orderRequest.size,
              limit_price: orderRequest.stopPrice,
              stop_price: orderRequest.stopPrice,
              stop_direction:
                orderRequest.side === OrderSide.SELL ? "STOP_DIRECTION_STOP_DOWN" : "STOP_DIRECTION_STOP_UP",
            },
          }
          break

        case OrderType.STOP_LIMIT:
          payload.order_configuration = {
            stop_limit_stop_limit_gtc: {
              base_size: orderRequest.size,
              limit_price: orderRequest.limitPrice,
              stop_price: orderRequest.stopPrice,
              stop_direction:
                orderRequest.side === OrderSide.SELL ? "STOP_DIRECTION_STOP_DOWN" : "STOP_DIRECTION_STOP_UP",
            },
          }
          break
      }

      // Send the request to create the order
      const response = await coinbaseRequest<any>("POST", "/api/v3/brokerage/orders", payload)

      // Parse the response
      return {
        orderId: response.order_id || response.id || "",
        productId: orderRequest.productId,
        side: orderRequest.side,
        orderType: orderRequest.orderType,
        size: orderRequest.size || "",
        funds: orderRequest.funds || "",
        limitPrice: orderRequest.limitPrice || "",
        stopPrice: orderRequest.stopPrice || "",
        status: response.status || "PENDING",
        filledSize: response.filled_size || "0",
        filledValue: response.filled_value || "0",
        createdAt: response.created_time || new Date().toISOString(),
        completedAt: response.completion_time,
      }
    } catch (error) {
      console.error("Error creating order:", error)

      // Handle specific error types
      if (error instanceof CoinbaseAPIError) {
        switch (error.type) {
          case "InvalidCredentials":
            throw new TradingError(
              "Authentication failed: Invalid API credentials",
              TradingErrorType.AUTHENTICATION,
              error,
            )
          case "InsufficientFunds":
            throw new TradingError("Insufficient funds to place order", TradingErrorType.INSUFFICIENT_FUNDS, error)
          case "RateLimit":
            throw new TradingError("Rate limit exceeded", TradingErrorType.RATE_LIMIT, error)
          default:
            throw new TradingError(error.message, TradingErrorType.UNKNOWN, error)
        }
      }

      // Handle other errors
      throw new TradingError(
        error instanceof Error ? error.message : "Unknown error creating order",
        TradingErrorType.UNKNOWN,
        error,
      )
    }
  }

  /**
   * Cancel an order
   * @param orderId Order ID
   * @returns Success status
   */
  public static async cancelOrder(orderId: string): Promise<boolean> {
    try {
      await coinbaseRequest<any>("DELETE", `/api/v3/brokerage/orders/${orderId}`)
      return true
    } catch (error) {
      console.error("Error canceling order:", error)

      // Handle specific error types
      if (error instanceof CoinbaseAPIError) {
        switch (error.type) {
          case "InvalidCredentials":
            throw new TradingError(
              "Authentication failed: Invalid API credentials",
              TradingErrorType.AUTHENTICATION,
              error,
            )
          default:
            throw new TradingError(error.message, TradingErrorType.UNKNOWN, error)
        }
      }

      // Handle other errors
      throw new TradingError(
        error instanceof Error ? error.message : "Unknown error canceling order",
        TradingErrorType.UNKNOWN,
        error,
      )
    }
  }

  /**
   * Get an order by ID
   * @param orderId Order ID
   * @returns Order response
   */
  public static async getOrder(orderId: string): Promise<OrderResponse> {
    try {
      const response = await coinbaseRequest<any>("GET", `/api/v3/brokerage/orders/historical/${orderId}`)

      // Parse the response
      return {
        orderId: response.order_id || response.id,
        productId: response.product_id,
        side: response.side as OrderSide,
        orderType: response.order_type as OrderType,
        size: response.base_size,
        funds: response.quote_size,
        limitPrice: response.limit_price,
        stopPrice: response.stop_price,
        status: response.status,
        filledSize: response.filled_size || "0",
        filledValue: response.filled_value || "0",
        createdAt: response.created_time,
        completedAt: response.completion_time,
      }
    } catch (error) {
      console.error("Error getting order:", error)

      // Handle specific error types
      if (error instanceof CoinbaseAPIError) {
        switch (error.type) {
          case "InvalidCredentials":
            throw new TradingError(
              "Authentication failed: Invalid API credentials",
              TradingErrorType.AUTHENTICATION,
              error,
            )
          default:
            throw new TradingError(error.message, TradingErrorType.UNKNOWN, error)
        }
      }

      // Handle other errors
      throw new TradingError(
        error instanceof Error ? error.message : "Unknown error getting order",
        TradingErrorType.UNKNOWN,
        error,
      )
    }
  }

  /**
   * Get open orders
   * @param productId Optional product ID to filter by
   * @returns Array of order responses
   */
  public static async getOpenOrders(productId?: string): Promise<OrderResponse[]> {
    try {
      let path = "/api/v3/brokerage/orders/historical?status=OPEN&limit=100"

      if (productId) {
        path += `&product_id=${productId}`
      }

      const response = await coinbaseRequest<any>("GET", path)

      // Parse the response
      return (response.orders || []).map((order: any) => ({
        orderId: order.order_id || order.id,
        productId: order.product_id,
        side: order.side as OrderSide,
        orderType: order.order_type as OrderType,
        size: order.base_size,
        funds: order.quote_size,
        limitPrice: order.limit_price,
        stopPrice: order.stop_price,
        status: order.status,
        filledSize: order.filled_size || "0",
        filledValue: order.filled_value || "0",
        createdAt: order.created_time,
        completedAt: order.completion_time,
      }))
    } catch (error) {
      console.error("Error getting open orders:", error)

      // Handle specific error types
      if (error instanceof CoinbaseAPIError) {
        switch (error.type) {
          case "InvalidCredentials":
            throw new TradingError(
              "Authentication failed: Invalid API credentials",
              TradingErrorType.AUTHENTICATION,
              error,
            )
          default:
            throw new TradingError(error.message, TradingErrorType.UNKNOWN, error)
        }
      }

      // Handle other errors
      throw new TradingError(
        error instanceof Error ? error.message : "Unknown error getting open orders",
        TradingErrorType.UNKNOWN,
        error,
      )
    }
  }

  /**
   * Get order history
   * @param productId Optional product ID to filter by
   * @param limit Maximum number of orders to return (default: 100)
   * @returns Array of order responses
   */
  public static async getOrderHistory(productId?: string, limit = 100): Promise<OrderResponse[]> {
    try {
      let path = `/api/v3/brokerage/orders/historical?limit=${limit}`

      if (productId) {
        path += `&product_id=${productId}`
      }

      const response = await coinbaseRequest<any>("GET", path)

      // Parse the response
      return (response.orders || []).map((order: any) => ({
        orderId: order.order_id || order.id,
        productId: order.product_id,
        side: order.side as OrderSide,
        orderType: order.order_type as OrderType,
        size: order.base_size,
        funds: order.quote_size,
        limitPrice: order.limit_price,
        stopPrice: order.stop_price,
        status: order.status,
        filledSize: order.filled_size || "0",
        filledValue: order.filled_value || "0",
        createdAt: order.created_time,
        completedAt: order.completion_time,
      }))
    } catch (error) {
      console.error("Error getting order history:", error)

      // Handle specific error types
      if (error instanceof CoinbaseAPIError) {
        switch (error.type) {
          case "InvalidCredentials":
            throw new TradingError(
              "Authentication failed: Invalid API credentials",
              TradingErrorType.AUTHENTICATION,
              error,
            )
          default:
            throw new TradingError(error.message, TradingErrorType.UNKNOWN, error)
        }
      }

      // Handle other errors
      throw new TradingError(
        error instanceof Error ? error.message : "Unknown error getting order history",
        TradingErrorType.UNKNOWN,
        error,
      )
    }
  }

  /**
   * Get account balances
   * @returns Account balances
   */
  public static async getAccountBalances(): Promise<any> {
    try {
      const response = await coinbaseRequest<any>("GET", "/api/v3/brokerage/accounts")
      return response.accounts || []
    } catch (error) {
      console.error("Error getting account balances:", error)

      // Handle specific error types
      if (error instanceof CoinbaseAPIError) {
        switch (error.type) {
          case "InvalidCredentials":
            throw new TradingError(
              "Authentication failed: Invalid API credentials",
              TradingErrorType.AUTHENTICATION,
              error,
            )
          default:
            throw new TradingError(error.message, TradingErrorType.UNKNOWN, error)
        }
      }

      // Handle other errors
      throw new TradingError(
        error instanceof Error ? error.message : "Unknown error getting account balances",
        TradingErrorType.UNKNOWN,
        error,
      )
    }
  }

  /**
   * Get positions
   * @returns Array of positions
   */
  public static async getPositions(): Promise<Position[]> {
    try {
      // Get account balances
      const accounts = await this.getAccountBalances()

      // Filter accounts with non-zero balances (excluding USD and stablecoins)
      const nonZeroAccounts = accounts.filter((account: any) => {
        const available = Number.parseFloat(account.available_balance?.value || "0")
        const hold = Number.parseFloat(account.hold?.value || "0")
        const total = available + hold

        // Skip USD and stablecoins
        const currency = account.currency
        if (currency === "USD" || currency === "USDC" || currency === "USDT") {
          return false
        }

        return total > 0
      })

      // Create positions array
      const positions: Position[] = []

      // Process each account with balance
      for (const account of nonZeroAccounts) {
        const currency = account.currency
        const productId = `${currency}-USD`

        // Get current price
        try {
          const ticker = await coinbaseRequest<any>("GET", `/api/v3/brokerage/products/${productId}/ticker`)

          const available = Number.parseFloat(account.available_balance?.value || "0")
          const hold = Number.parseFloat(account.hold?.value || "0")
          const size = (available + hold).toString()

          const markPrice = ticker.price || "0"

          // Estimate entry price (this is a simplification)
          // In a real system, you would track the actual entry prices
          const entryPrice = (Number.parseFloat(markPrice) * 0.98).toString()

          const value = Number.parseFloat(size) * Number.parseFloat(markPrice)
          const cost = Number.parseFloat(size) * Number.parseFloat(entryPrice)
          const pnl = (value - cost).toString()
          const pnlPercentage = (((value - cost) / cost) * 100).toString()

          positions.push({
            productId,
            size,
            entryPrice,
            markPrice,
            pnl,
            pnlPercentage,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          })
        } catch (error) {
          console.error(`Error getting price for ${productId}:`, error)
          // Skip this position if we can't get the price
          continue
        }
      }

      return positions
    } catch (error) {
      console.error("Error getting positions:", error)

      // Handle specific error types
      if (error instanceof CoinbaseAPIError) {
        switch (error.type) {
          case "InvalidCredentials":
            throw new TradingError(
              "Authentication failed: Invalid API credentials",
              TradingErrorType.AUTHENTICATION,
              error,
            )
          default:
            throw new TradingError(error.message, TradingErrorType.UNKNOWN, error)
        }
      }

      // Handle other errors
      throw new TradingError(
        error instanceof Error ? error.message : "Unknown error getting positions",
        TradingErrorType.UNKNOWN,
        error,
      )
    }
  }
}
