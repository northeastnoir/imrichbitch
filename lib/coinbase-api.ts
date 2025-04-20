// Fix TypeScript errors by adding proper type annotations
import crypto from 'crypto';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Error types
export enum CoinbaseErrorType {
  AUTHENTICATION = 'InvalidCredentials',
  RATE_LIMIT = 'RateLimit',
  INSUFFICIENT_FUNDS = 'InsufficientFunds',
  INVALID_REQUEST = 'InvalidRequest',
  UNKNOWN = 'Unknown',
}

// Custom error class for Coinbase API errors
export class CoinbaseAPIError extends Error {
  type: CoinbaseErrorType;
  statusCode?: number;
  
  constructor(message: string, type: CoinbaseErrorType = CoinbaseErrorType.UNKNOWN, statusCode?: number) {
    super(message);
    this.name = 'CoinbaseAPIError';
    this.type = type;
    this.statusCode = statusCode;
  }
}

// Response types
interface CoinbaseOrderResponse {
  order_id: string;
  status: string;
  [key: string]: any;
}

interface CoinbaseProductsResponse {
  products?: any[];
  [key: string]: any;
}

// Monitoring service for logging
export const monitoring = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data || '');
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data || '');
  },
  error: (message: string, data?: any) => {
    console.error(`[ERROR] ${message}`, data || '');
  },
  recordTradeEvent: (data: any) => {
    console.log(`[TRADE] Recording trade event:`, data);
  }
};

// Retry logic for API requests
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry certain errors
      if (error instanceof CoinbaseAPIError) {
        if (error.type === CoinbaseErrorType.AUTHENTICATION || 
            error.type === CoinbaseErrorType.INSUFFICIENT_FUNDS) {
          throw error;
        }
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying
      const retryDelay = delay * Math.pow(2, attempt - 1);
      monitoring.warn(`Retrying after error (attempt ${attempt}/${maxRetries}). Waiting ${retryDelay}ms`, {
        error: lastError instanceof Error ? lastError.message : 'Unknown error',
      });
      
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
  
  throw lastError;
}

// Make JWT authenticated request to Coinbase API
export async function makeJwtAuthenticatedRequest<T>(
  method: string,
  path: string,
  body?: any,
  queryParams?: Record<string, string>
): Promise<T> {
  const apiKey = process.env.COINBASE_API_KEY;
  const apiSecret = process.env.COINBASE_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    throw new CoinbaseAPIError(
      'Missing Coinbase API credentials',
      CoinbaseErrorType.AUTHENTICATION
    );
  }
  
  try {
    // Prepare the request
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const url = new URL(`https://api.coinbase.com${path}`);
    
    // Add query parameters if provided
    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }
    
    // Create the message to sign
    const requestPath = url.pathname + url.search;
    const bodyString = body ? JSON.stringify(body) : '';
    const message = timestamp + method + requestPath + bodyString;
    
    // Sign the message
    const hmac = crypto.createHmac('sha256', apiSecret);
    const signature = hmac.update(message).digest('hex');
    
    // Make the request
    const response = await axios({
      method,
      url: url.toString(),
      headers: {
        'CB-ACCESS-KEY': apiKey,
        'CB-ACCESS-SIGN': signature,
        'CB-ACCESS-TIMESTAMP': timestamp,
        'Content-Type': 'application/json',
      },
      data: body,
    });
    
    return response.data as T;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response;
      
      // Determine error type based on status code and response
      let errorType = CoinbaseErrorType.UNKNOWN;
      
      if (status === 401) {
        errorType = CoinbaseErrorType.AUTHENTICATION;
      } else if (status === 429) {
        errorType = CoinbaseErrorType.RATE_LIMIT;
      } else if (status === 400 && data?.message?.includes('insufficient funds')) {
        errorType = CoinbaseErrorType.INSUFFICIENT_FUNDS;
      } else if (status === 400) {
        errorType = CoinbaseErrorType.INVALID_REQUEST;
      }
      
      throw new CoinbaseAPIError(
        data?.message || `Coinbase API error: ${status}`,
        errorType,
        status
      );
    }
    
    throw new CoinbaseAPIError(
      error instanceof Error ? error.message : 'Unknown error',
      CoinbaseErrorType.UNKNOWN
    );
  }
}

// Create a market order
export async function createMarketOrder(
  productId: string,
  side: string,
  size: string,
  isSizeInQuote = false
): Promise<CoinbaseOrderResponse> {
  try {
    const clientOrderId = `super777-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Configure order based on size type
    let orderConfiguration: any = {};
    if (isSizeInQuote) {
      orderConfiguration = {
        market_market_ioc: {
          quote_size: size,
        },
      };
    } else {
      orderConfiguration = {
        market_market_ioc: {
          base_size: size,
        },
      };
    }
    
    // Prepare payload
    const payload = {
      client_order_id: clientOrderId,
      product_id: productId,
      side: side,
      order_configuration: orderConfiguration,
    };
    
    monitoring.info(`Placing ${side} order for ${productId}`, { size, isSizeInQuote });
    const response = await makeJwtAuthenticatedRequest<CoinbaseOrderResponse>("POST", "/api/v3/brokerage/orders", payload);
    
    // Log successful order
    monitoring.info(`Successfully placed ${side} order for ${productId}`, {
      orderId: response.order_id,
      status: response.status,
    });
    
    return response;
  } catch (error) {
    console.error(`Error placing ${side} order for ${productId}:`, error);
    monitoring.error(`Failed to place ${side} order for ${productId}`, {
      error: error instanceof Error ? error.message : "Unknown error",
      size,
      isSizeInQuote,
    });
    throw error;
  }
}

// Create a limit order
export async function createLimitOrder(
  productId: string,
  side: string,
  size: string,
  limitPrice: string,
  timeInForce = 'GTC',
  postOnly = false
): Promise<CoinbaseOrderResponse> {
  try {
    const clientOrderId = `super777-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Configure order
    const orderConfiguration = {
      limit_limit_gtc: {
        base_size: size,
        limit_price: limitPrice,
        post_only: postOnly,
      },
    };
    
    // Prepare payload
    const payload = {
      client_order_id: clientOrderId,
      product_id: productId,
      side: side,
      order_configuration: orderConfiguration,
    };
    
    monitoring.info(`Placing ${side} limit order for ${productId}`, { 
      size, 
      limitPrice,
      timeInForce,
      postOnly 
    });
    
    const response = await makeJwtAuthenticatedRequest<CoinbaseOrderResponse>("POST", "/api/v3/brokerage/orders", payload);
    
    // Log successful order
    monitoring.info(`Successfully placed ${side} limit order for ${productId}`, {
      orderId: response.order_id,
      status: response.status,
    });
    
    return response;
  } catch (error) {
    console.error(`Error placing ${side} limit order for ${productId}:`, error);
    monitoring.error(`Failed to place ${side} limit order for ${productId}`, {
      error: error instanceof Error ? error.message : "Unknown error",
      size,
      limitPrice,
    });
    throw error;
  }
}

// Get historical candles
export async function getCandles(productId: string, granularity: string, start?: string, end?: string) {
  return withRetry(async () => {
    try {
      let path = `/api/v3/brokerage/products/${productId}/candles?granularity=${granularity}`;
      if (start) path += `&start=${start}`;
      if (end) path += `&end=${end}`;
      
      return await makeJwtAuthenticatedRequest("GET", path);
    } catch (error) {
      console.error(`Error fetching candles for ${productId}:`, error);
      throw error;
    }
  });
}

// Test API connection
export async function testConnection() {
  return withRetry(async () => {
    try {
      const response = await makeJwtAuthenticatedRequest<CoinbaseProductsResponse>("GET", "/api/v3/brokerage/products");
      return {
        success: true,
        message: "Successfully connected to Coinbase API",
        productsCount: response.products?.length || 0,
      };
    } catch (error) {
      console.error("Error testing Coinbase connection:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error connecting to Coinbase API",
      };
    }
  });
}

// Get account balances
export async function getAccountBalances() {
  try {
    const response = await makeJwtAuthenticatedRequest<any>("GET", "/api/v3/brokerage/accounts");
    return response.accounts || [];
  } catch (error) {
    console.error("Error getting account balances:", error);
    throw error;
  }
}

// Get open orders
export async function getOpenOrders() {
  try {
    const response = await makeJwtAuthenticatedRequest<any>("GET", "/api/v3/brokerage/orders/historical/pending");
    return response.orders || [];
  } catch (error) {
    console.error("Error getting open orders:", error);
    throw error;
  }
}

// Get order by ID
export async function getOrderById(orderId: string) {
  try {
    const response = await makeJwtAuthenticatedRequest<any>("GET", `/api/v3/brokerage/orders/historical/${orderId}`);
    return response;
  } catch (error) {
    console.error(`Error getting order ${orderId}:`, error);
    throw error;
  }
}

// Cancel order
export async function cancelOrder(orderId: string) {
  try {
    const response = await makeJwtAuthenticatedRequest<any>("POST", "/api/v3/brokerage/orders/batch_cancel", {
      order_ids: [orderId],
    });
    return response;
  } catch (error) {
    console.error(`Error canceling order ${orderId}:`, error);
    throw error;
  }
}
