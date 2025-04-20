import { createMarketOrder as createCoinbaseMarketOrder, createLimitOrder as createCoinbaseLimitOrder } from './coinbase-api';
import { createMarketOrder as createKrakenMarketOrder, createLimitOrder as createKrakenLimitOrder } from './kraken-api';
import { monitoring } from './monitoring-service';

// Enum for order sides
export enum OrderSide {
  BUY = 'BUY',
  SELL = 'SELL'
}

// Enum for exchange types
export enum ExchangeType {
  COINBASE = 'COINBASE',
  KRAKEN = 'KRAKEN'
}

// Enum for error types
export enum TradingErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  RATE_LIMIT = 'RATE_LIMIT',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  INVALID_REQUEST = 'INVALID_REQUEST',
  UNKNOWN = 'UNKNOWN'
}

// Custom error class for trading errors
export class TradingError extends Error {
  type: TradingErrorType;
  originalError?: any;
  
  constructor(message: string, type: TradingErrorType = TradingErrorType.UNKNOWN, originalError?: any) {
    super(message);
    this.name = 'TradingError';
    this.type = type;
    this.originalError = originalError;
  }
}

// Interface for position data
export interface Position {
  productId: string;
  size: string;
  entryPrice: string;
  markPrice: string;
  pnl: string;
  pnlPercentage: string;
  createdAt: string;
  updatedAt: string;
}

// Interface for order data
export interface Order {
  orderId: string;
  productId: string;
  side: OrderSide;
  size: string;
  price?: string;
  type: 'market' | 'limit';
  status: string;
  createdAt: string;
  filledSize?: string;
  filledValue?: string;
  fee?: string;
  completedAt?: string;
}

// Interface for order response
interface OrderResponse {
  orderId: string;
  status: string;
  productId: string;
  side: string;
  size: string;
  price?: string;
  type: string;
  createdAt?: string;
}

// Main trading service class
export class TradingService {
  /**
   * Create a market order
   * @param productId Product ID (e.g., BTC-USD)
   * @param side Order side (BUY or SELL)
   * @param size Order size
   * @param exchange Exchange to use (defaults to COINBASE)
   * @returns Order details
   */
  public static async createMarketOrder(
    productId: string,
    side: OrderSide,
    size: string,
    exchange: ExchangeType = ExchangeType.COINBASE
  ): Promise<OrderResponse> {
    try {
      monitoring.info(`Creating ${side} market order for ${productId} on ${exchange}`, { size });
      
      // Determine which exchange to use
      if (exchange === ExchangeType.COINBASE) {
        const response = await createCoinbaseMarketOrder(productId, side, size);
        return {
          orderId: response.order_id,
          productId,
          side,
          size,
          type: 'market',
          status: response.status || 'pending',
          createdAt: new Date().toISOString()
        };
      } else if (exchange === ExchangeType.KRAKEN) {
        const krakenSide = side === OrderSide.BUY ? 'buy' : 'sell';
        const response = await createKrakenMarketOrder(productId, krakenSide, size);
        return {
          orderId: response.orderId,
          productId,
          side,
          size,
          type: 'market',
          status: response.status || 'pending',
          createdAt: new Date().toISOString()
        };
      } else {
        throw new TradingError(`Unsupported exchange: ${exchange}`, TradingErrorType.INVALID_REQUEST);
      }
    } catch (error) {
      console.error(`Error creating market order:`, error);
      monitoring.error(`Failed to create market order`, {
        error: error instanceof Error ? error.message : "Unknown error",
        productId,
        side,
        size,
        exchange
      });
      
      throw new TradingError(
        error instanceof Error ? error.message : 'Unknown error creating market order',
        TradingErrorType.UNKNOWN,
        error
      );
    }
  }

  /**
   * Create a limit order
   * @param productId Product ID (e.g., BTC-USD)
   * @param side Order side (BUY or SELL)
   * @param size Order size
   * @param price Limit price
   * @param exchange Exchange to use (defaults to COINBASE)
   * @returns Order details
   */
  public static async createLimitOrder(
    productId: string,
    side: OrderSide,
    size: string,
    price: string,
    exchange: ExchangeType = ExchangeType.COINBASE
  ): Promise<OrderResponse> {
    try {
      monitoring.info(`Creating ${side} limit order for ${productId} on ${exchange}`, { 
        size, 
        price 
      });
      
      // Determine which exchange to use
      if (exchange === ExchangeType.COINBASE) {
        const response = await createCoinbaseLimitOrder(productId, side, size, price);
        return {
          orderId: response.order_id,
          productId,
          side,
          size,
          price,
          type: 'limit',
          status: response.status || 'pending',
          createdAt: new Date().toISOString()
        };
      } else if (exchange === ExchangeType.KRAKEN) {
        const krakenSide = side === OrderSide.BUY ? 'buy' : 'sell';
        const response = await createKrakenLimitOrder(productId, krakenSide, size, price);
        return {
          orderId: response.orderId,
          productId,
          side,
          size,
          price,
          type: 'limit',
          status: response.status || 'pending',
          createdAt: new Date().toISOString()
        };
      } else {
        throw new TradingError(`Unsupported exchange: ${exchange}`, TradingErrorType.INVALID_REQUEST);
      }
    } catch (error) {
      console.error(`Error creating limit order:`, error);
      monitoring.error(`Failed to create limit order`, {
        error: error instanceof Error ? error.message : "Unknown error",
        productId,
        side,
        size,
        price,
        exchange
      });
      
      throw new TradingError(
        error instanceof Error ? error.message : 'Unknown error creating limit order',
        TradingErrorType.UNKNOWN,
        error
      );
    }
  }

  /**
   * Determine which exchange to use based on environment variables and product ID
   * @param productId Product ID
   * @returns Exchange type to use
   */
  public static determineExchange(productId: string): ExchangeType {
    // Check if exchange preference is explicitly set in environment
    const preferredExchange = process.env.PREFERRED_EXCHANGE;
    if (preferredExchange === 'COINBASE') return ExchangeType.COINBASE;
    if (preferredExchange === 'KRAKEN') return ExchangeType.KRAKEN;
    
    // Check if we have credentials for both exchanges
    const hasCoinbaseCredentials = process.env.COINBASE_API_KEY && process.env.COINBASE_API_SECRET;
    const hasKrakenCredentials = process.env.KRAKEN_API_KEY && process.env.KRAKEN_API_SECRET;
    
    // If we only have credentials for one exchange, use that one
    if (hasCoinbaseCredentials && !hasKrakenCredentials) return ExchangeType.COINBASE;
    if (!hasCoinbaseCredentials && hasKrakenCredentials) return ExchangeType.KRAKEN;
    
    // If we have both, make a decision based on the product ID
    // This is a simplified approach - in a real system, you might want to
    // check liquidity, fees, or other factors
    
    // Default to Coinbase for most common pairs
    return ExchangeType.COINBASE;
  }
}
