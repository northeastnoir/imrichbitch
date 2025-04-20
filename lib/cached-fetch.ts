type CacheOptions = {
  duration: number // Cache duration in milliseconds
  staleWhileRevalidate?: boolean // Return stale data while fetching fresh data
  bypassCache?: boolean // Force a fresh fetch
}

const DEFAULT_CACHE_OPTIONS: CacheOptions = {
  duration: 30000, // 30 seconds default
  staleWhileRevalidate: true,
}

// In-memory cache for server-side or client-side
const memoryCache: Record<string, { data: any; timestamp: number }> = {}

// Clean up memory cache periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now()
    Object.keys(memoryCache).forEach((key) => {
      if (now - memoryCache[key].timestamp > 300000) {
        // 5 minutes max cache
        delete memoryCache[key]
      }
    })
  }, 60000) // Clean every minute
}

export async function cachedFetch<T>(
  url: string,
  options: RequestInit = {},
  cacheOptions: CacheOptions = DEFAULT_CACHE_OPTIONS,
): Promise<T> {
  // Create a cache key based on the URL and request options
  const cacheKey = `cached-fetch:${url}:${JSON.stringify(options)}`

  // Force fresh fetch if requested
  if (cacheOptions.bypassCache) {
    return fetchAndCache<T>(url, options, cacheKey, cacheOptions.duration)
  }

  // Check if we're in a browser environment
  const isBrowser = typeof window !== "undefined"

  // Try memory cache first (works in both browser and server)
  if (memoryCache[cacheKey]) {
    const { data, timestamp } = memoryCache[cacheKey]
    const isStale = Date.now() - timestamp > cacheOptions.duration

    // If data is fresh or we want to use stale data while revalidating
    if (!isStale || cacheOptions.staleWhileRevalidate) {
      // If stale but we want to revalidate, fetch in background
      if (isStale && cacheOptions.staleWhileRevalidate) {
        fetchAndCache<T>(url, options, cacheKey, cacheOptions.duration).catch(console.error)
      }

      // Return cached data
      return data as T
    }
  }

  // If in browser, try sessionStorage as well
  if (isBrowser) {
    try {
      // Try to get cached data from sessionStorage
      const cachedData = sessionStorage.getItem(cacheKey)

      if (cachedData) {
        const { data, timestamp } = JSON.parse(cachedData)
        const isStale = Date.now() - timestamp > cacheOptions.duration

        // If data is fresh or we want to use stale data while revalidating
        if (!isStale || cacheOptions.staleWhileRevalidate) {
          // If stale but we want to revalidate, fetch in background
          if (isStale && cacheOptions.staleWhileRevalidate) {
            fetchAndCache<T>(url, options, cacheKey, cacheOptions.duration).catch(console.error)
          }

          // Return cached data
          return data as T
        }
      }
    } catch (error) {
      console.error("Error reading from cache:", error)
      // Continue to fetch if cache read fails
    }
  }

  // If no cache hit or not in browser, fetch and cache
  return fetchAndCache<T>(url, options, cacheKey, cacheOptions.duration)
}

async function fetchAndCache<T>(
  url: string,
  options: RequestInit,
  cacheKey: string,
  cacheDuration: number,
): Promise<T> {
  // Add timeout to fetch
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()

    // Cache the result in memory (works in both browser and server)
    memoryCache[cacheKey] = {
      data,
      timestamp: Date.now(),
    }

    // Cache in sessionStorage if in browser
    if (typeof window !== "undefined") {
      try {
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          }),
        )
      } catch (error) {
        console.error("Error writing to cache:", error)
      }
    }

    return data as T
  } catch (error) {
    clearTimeout(timeoutId)
    console.error(`Fetch error for ${url}:`, error)
    throw error
  }
}
