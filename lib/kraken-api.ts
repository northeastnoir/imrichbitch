import crypto from 'crypto';
import axios from 'axios';
import querystring from 'querystring';

// Error types
export enum KrakenErrorType {
  AUTHENTICATION = 'InvalidCredentials',
  RATE_LIMIT = 'RateLimit',
  INSUFFICIENT_FUNDS = 'InsufficientFunds',
  INVALID_REQUEST = 'InvalidRequest',
  UNKNOWN = 'Unknown',
}

// Custom error class for Kraken API errors
export class KrakenAPIError extends Error {
  type: KrakenErrorType;
  statusCode?: number;
  
  constructor(message: string, type: KrakenErrorType = KrakenErrorType.UNKNOWN, statusCode?: number) {
    super(message);
    this.name = 'KrakenAPIError';
    this.type = type;
    this.statusCode = statusCode;
  }
}

// Response types
interface KrakenOrderResponse {
  txid: string[];
  descr: any;
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
      if (error instanceof KrakenAPIError) {
        if (error.type === KrakenErrorType.AUTHENTICATION || 
            error.type === KrakenErrorType.INSUFFICIENT_FUNDS) {
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

// Generate a nonce for Kraken API
function generateNonce(): string {
  return Date.now().toString();
}

// Convert pair format from Coinbase to Kraken (e.g., BTC-USD to XBTUSD)
export function convertPairFormat(pair: string): string {
  const [base, quote] = pair.split('-');
  
  // Kraken uses XBT instead of BTC
  const krakenBase = base === 'BTC' ? 'XBT' : base;
  
  return `${krakenBase}${quote}`;
}

// Convert pair format from Kraken to Coinbase (e.g., XBTUSD to BTC-USD)
export function convertPairFormatFromKraken(pair: string): string {
  // Extract base and quote currencies
  // This is a simplified approach - in a real implementation, you'd need to handle
  // all the special cases in Kraken's pair naming
  let base = '';
  let quote = '';
  
  if (pair.startsWith('XBT')) {
    base = 'BTC';
    quote = pair.substring(3);
  } else {
    // Simple approach for other pairs
    // In reality, you'd need more complex logic for Kraken's naming conventions
    base = pair.substring(0, 3);
    quote = pair.substring(3);
  }
  
  return `${base}-${quote}`;
}

// Make authenticated request to Kraken API
export async function makeKrakenAuthenticatedRequest<T>(
  method: string,
  endpoint: string,
  data: Record<string, any> = {}
): Promise<T> {
  const apiKey = process.env.KRAKEN_API_KEY;
  const apiSecret = process.env.KRAKEN_API_SECRET;
  
  if (!apiKey || !apiSecret) {
    throw new KrakenAPIError(
      'Missing Kraken API credentials',
      KrakenErrorType.AUTHENTICATION
    );
  }
  
  try {
    // Add nonce to data
    const nonce = generateNonce();
    const requestData = {
      ...data,
      nonce,
    };
    
    // Create signature
    const path = `/0/private/${endpoint}`;
    const postData = querystring.stringify(requestData);
    const secret = Buffer.from(apiSecret, 'base64');
    
    // Message signature using HMAC-SHA512 of (URI path + SHA256(nonce + POST data))
    const message = postData;
    const hash = crypto.createHash('sha256');
    const hmac = crypto.createHmac('sha512', secret);
    const hashDigest = hash.update(nonce + message).digest('binary');
    const hmacDigest = hmac.update(path + hashDigest, 'binary').digest('base64');
    
    // Make the request
    const response = await axios({
      method,
      url: `https://api.kraken.com${path}`,
      headers: {
        'API-Key': apiKey,
        'API-Sign': hmacDigest,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      data: postData,
    });
    
    // Check for errors in the response
    if (response.data.error && response.data.error.length > 0) {
      const errorMessage = response.data.error.join(', ');
      
      // Determine error type
      let errorType = KrakenErrorType.UNKNOWN;
      
      if (errorMessage.includes('Invalid key') || errorMessage.includes('Invalid signature')) {
        errorType = KrakenErrorType.AUTHENTICATION;
      } else if (errorMessage.includes('Rate limit exceeded')) {
        errorType = KrakenErrorType.RATE_LIMIT;
      } else if (errorMessage.includes('Insufficient funds')) {
        errorType = KrakenErrorType.INSUFFICIENT_FUNDS;
      } else if (errorMessage.includes('Invalid arguments')) {
        errorType = KrakenErrorType.INVALID_REQUEST;
      }
      
      throw new KrakenAPIError(errorMessage, errorType);
    }
    
    return response.data.result as T;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response;
      
      // Determine error type based on status code and response
      let errorType = KrakenErrorType.UNKNOWN;
      let errorMessage = 'Unknown Kraken API error';
      
      if (data && data.error && data.error.length > 0) {
        errorMessage = data.error.join(', ');
        
        if (errorMessage.includes('Invalid key') || errorMessage.includes('Invalid signature')) {
          errorType = KrakenErrorType.AUTHENTICATION;
        } else if (errorMessage.includes('Rate limit exceeded')) {
          errorType = KrakenErrorType.RATE_LIMIT;
        } else if (errorMessage.includes('Insufficient funds')) {
          errorType = KrakenErrorType.INSUFFICIENT_FUNDS;
        } else if (errorMessage.includes('Invalid arguments')) {
          errorType = KrakenErrorType.INVALID_REQUEST;
        }
      } else if (status === 401 || status === 403) {
        errorType = KrakenErrorType.AUTHENTICATION;
        errorMessage = 'Authentication failed';
      } else if (status === 429) {
        errorType = KrakenErrorType.RATE_LIMIT;
        errorMessage = 'Rate limit exceeded';
      }
      
      throw new KrakenAPIError(errorMessage, errorType, status);
    }
    
    throw new KrakenAPIError(
      error instanceof Error ? error.message : 'Unknown error',
      KrakenErrorType.UNKNOWN
    );
  }
}

// Make public request to Kraken API
export async function makeKrakenPublicRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
  try {
    const queryParams = querystring.stringify(params);
    const url = `https://api.kraken.com/0/public/${endpoint}${queryParams ? `?${queryParams}` : ''}`;
    
    const response = await axios.get(url);
    
    // Check for errors in the response
    if (response.data.error && response.data.error.length > 0) {
      throw new KrakenAPIError(response.data.error.join(', '));
    }
    
    return response.data.result as T;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const { status, data } = error.response;
      
      let errorMessage = 'Unknown Kraken API error';
      if (data && data.error && data.error.length > 0) {
        errorMessage = data.error.join(', ');
      }
      
      throw new KrakenAPIError(errorMessage, KrakenErrorType.UNKNOWN, status);
    }
    
    throw new KrakenAPIError(
      error instanceof Error ? error.message : 'Unknown error',
      KrakenErrorType.UNKNOWN
    );
  }
}

// Create a market order
export async function createMarketOrder(
  pair: string,
  type: 'buy' | 'sell',
  volume: string
) {
  try {
    // Convert pair format if needed
    const krakenPair = convertPairFormat(pair);
    
    monitoring.info(`Placing ${type} market order for ${krakenPair}`, { volume });
    
    const orderData = {
      pair: krakenPair,
      type,
      ordertype: 'market',
      volume,
    };
    
    const response = await makeKrakenAuthenticatedRequest<KrakenOrderResponse>('POST', 'AddOrder', orderData);
    
    // Log successful order
    monitoring.info(`Successfully placed ${type} market order for ${krakenPair}`, {
      txid: response.txid,
      description: response.descr,
    });
    
    return {
      orderId: response.txid[0],
      status: 'placed',
      productId: pair,
      side: type,
      size: volume,
      type: 'market',
    };
  } catch (error) {
    console.error(`Error placing ${type} market order for ${pair}:`, error);
    monitoring.error(`Failed to place ${type} market order for ${pair}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      volume,
    });
    throw error;
  }
}

// Create a limit order
export async function createLimitOrder(
  pair: string,
  type: 'buy' | 'sell',
  volume: string,
  price: string,
  timeInForce = 'GTC'
) {
  try {
    // Convert pair format if needed
    const krakenPair = convertPairFormat(pair);
    
    monitoring.info(`Placing ${type} limit order for ${krakenPair}`, { 
      volume, 
      price,
      timeInForce 
    });
    
    // Map time in force
    let expiretm: string | undefined;
    if (timeInForce === 'IOC') {
      expiretm = '+0'; // Immediate or cancel
    } else if (timeInForce === 'GTD') {
      // Good till date - would need a specific timestamp
      expiretm = '+86400'; // 24 hours as an example
    }
    // GTC is default in Kraken
    
    const orderData: Record<string, any> = {
      pair: krakenPair,
      type,
      ordertype: 'limit',
      price,
      volume,
    };
    
    // Add expiration if specified
    if (expiretm) {
      orderData.expiretm = expiretm;
    }
    
    const response = await makeKrakenAuthenticatedRequest<KrakenOrderResponse>('POST', 'AddOrder', orderData);
    
    // Log successful order
    monitoring.info(`Successfully placed ${type} limit order for ${krakenPair}`, {
      txid: response.txid,
      description: response.descr,
    });
    
    return {
      orderId: response.txid[0],
      status: 'placed',
      productId: pair,
      side: type,
      size: volume,
      price,
      type: 'limit',
      timeInForce,
    };
  } catch (error) {
    console.error(`Error placing ${type} limit order for ${pair}:`, error);
    monitoring.error(`Failed to place ${type} limit order for ${pair}`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      volume,
      price,
    });
    throw error;
  }
}

// Get account balances
export async function getAccountBalances() {
  try {
    const response = await makeKrakenAuthenticatedRequest<any>('POST', 'Balance', {});
    
    // Transform to a format similar to Coinbase for consistency
    const balances = Object.entries(response).map(([currency, balance]) => ({
      currency,
      available: balance,
      hold: '0',
    }));
    
    return balances;
  } catch (error) {
    console.error('Error getting account balances:', error);
    throw error;
  }
}

// Get open orders
export async function getOpenOrders() {
  try {
    const response = await makeKrakenAuthenticatedRequest<any>('POST', 'OpenOrders', {});
    
    // Transform to a format similar to Coinbase for consistency
    const orders = Object.entries(response.open).map(([orderId, orderDetails]: [string, any]) => ({
      id: orderId,
      product_id: convertPairFormatFromKraken(orderDetails.descr.pair),
      side: orderDetails.descr.type,
      size: orderDetails.vol,
      price: orderDetails.descr.price,
      type: orderDetails.descr.ordertype,
      created_at: new Date(orderDetails.opentm * 1000).toISOString(),
      status: 'open',
    }));
    
    return orders;
  } catch (error) {
    console.error('Error getting open orders:', error);
    throw error;
  }
}

// Get closed orders
export async function getClosedOrders() {
  try {
    const response = await makeKrakenAuthenticatedRequest<any>('POST', 'ClosedOrders', {});
    
    // Transform to a format similar to Coinbase for consistency
    const orders = Object.entries(response.closed).map(([orderId, orderDetails]: [string, any]) => ({
      id: orderId,
      product_id: convertPairFormatFromKraken(orderDetails.descr.pair),
      side: orderDetails.descr.type,
      size: orderDetails.vol,
      price: orderDetails.descr.price,
      type: orderDetails.descr.ordertype,
      created_at: new Date(orderDetails.opentm * 1000).toISOString(),
      closed_at: new Date(orderDetails.closetm * 1000).toISOString(),
      status: orderDetails.status,
    }));
    
    return orders;
  } catch (error) {
    console.error('Error getting closed orders:', error);
    throw error;
  }
}

// Cancel order
export async function cancelOrder(orderId: string) {
  try {
    const response = await makeKrakenAuthenticatedRequest<any>('POST', 'CancelOrder', {
      txid: orderId,
    });
    
    return {
      success: response.count > 0,
      count: response.count,
    };
  } catch (error) {
    console.error(`Error canceling order ${orderId}:`, error);
    throw error;
  }
}

// Get ticker information
export async function getTicker(pair: string) {
  try {
    const krakenPair = convertPairFormat(pair);
    const response = await makeKrakenPublicRequest<any>('Ticker', { pair: krakenPair });
    
    // Extract ticker data for the specified pair
    const tickerData = response[Object.keys(response)[0]];
    
    return {
      product_id: pair,
      price: tickerData.c[0],
      bid: tickerData.b[0],
      ask: tickerData.a[0],
      volume: tickerData.v[1],
      time: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Error getting ticker for ${pair}:`, error);
    throw error;
  }
}

// Test API connection
export async function testConnection() {
  return withRetry(async () => {
    try {
      const response = await makeKrakenAuthenticatedRequest<any>('POST', 'Balance', {});
      return {
        success: true,
        message: 'Successfully connected to Kraken API',
        balancesCount: Object.keys(response).length,
      };
    } catch (error) {
      console.error('Error testing Kraken connection:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error connecting to Kraken API',
      };
    }
  });
}
