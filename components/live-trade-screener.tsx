"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowDown, ArrowUp, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cachedFetch } from "@/lib/cached-fetch"

// Define the Position type to match what our API returns
type Position = {
  pair: string
  entryPrice: number
  currentPrice: number
  quantity: number
  value: number
  pnlPercentage: number
  pnlValue: number
  timestamp: string
}

export function LiveTradeScreener() {
  const [positions, setPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Function to fetch positions with error handling
  const fetchPositions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Try to fetch positions from API, but don't wait indefinitely
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

      try {
        // Use cachedFetch to avoid hammering the API
        const data = await cachedFetch<any>(
          "/api/active-positions",
          { signal: controller.signal },
          { duration: 30000 }, // Cache for 30 seconds
        )

        clearTimeout(timeoutId)

        // Check if the data has the expected format
        if (data.success && Array.isArray(data.positions)) {
          setPositions(data.positions)
          setLastUpdated(new Date().toLocaleTimeString())
        } else if (data.positions && Array.isArray(data.positions)) {
          setPositions(data.positions)
          setLastUpdated(new Date().toLocaleTimeString())

          // Show a warning if using mock data
          if (data.isMockData) {
            setError("Using mock data - API credentials may not be configured correctly")
          }
        } else {
          console.warn("Unexpected data format:", data)
          setError("Received unexpected data format from API")
          // Use fallback data
          setPositions(getMockPositions())
        }
      } catch (fetchError) {
        console.error("Error fetching positions:", fetchError)
        // Use fallback data on fetch error
        setPositions(getMockPositions())
        setError(
          fetchError instanceof Error
            ? `Failed to fetch positions: ${fetchError.message}`
            : "Failed to fetch positions",
        )

        // If it's an authentication error, provide a more helpful message
        if (
          fetchError instanceof Error &&
          (fetchError.message.includes("Invalid API Key") || fetchError.message.includes("Authentication failed"))
        ) {
          setError("Authentication failed: Please check your Coinbase API credentials in your environment variables")
        }
      }
    } catch (err) {
      console.error("Error in fetchPositions:", err)
      setError("An unexpected error occurred")
      // Use fallback data on any error
      setPositions(getMockPositions())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPositions()

    // Set up polling to refresh data every 30 seconds
    const intervalId = setInterval(fetchPositions, 30000)

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [fetchPositions])

  // Mock position data for fallback
  function getMockPositions(): Position[] {
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

  return (
    <Card className="bg-gray-100">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Active Positions</CardTitle>
          <CardDescription>{error ? "Using mock data (API error)" : "Your current trading positions"}</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchPositions} disabled={loading} className="h-8 px-2 text-xs">
          <RefreshCw className={`h-3 w-3 mr-1 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-amber-700">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="flex flex-col items-center">
              <RefreshCw className="h-8 w-8 text-gray-400 animate-spin mb-2" />
              <p className="text-gray-500">Loading positions...</p>
            </div>
          </div>
        ) : positions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead className="text-right">Entry Price</TableHead>
                  <TableHead className="text-right">Current Price</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="text-right">PnL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => (
                  <TableRow key={position.pair} className="bg-gray-50">
                    <TableCell className="font-medium">{position.pair}</TableCell>
                    <TableCell className="text-right">{position.quantity.toFixed(6)}</TableCell>
                    <TableCell className="text-right">${position.entryPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${position.currentPrice.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${position.value.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {position.pnlPercentage >= 0 ? (
                          <ArrowUp className="h-4 w-4 text-green-500" />
                        ) : (
                          <ArrowDown className="h-4 w-4 text-red-500" />
                        )}
                        <span className={position.pnlPercentage >= 0 ? "text-green-600" : "text-red-600"}>
                          ${Math.abs(position.pnlValue).toFixed(2)} ({Math.abs(position.pnlPercentage).toFixed(2)}%)
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">No active positions found.</div>
        )}

        {lastUpdated && (
          <div className="text-right mt-2">
            <span className="text-xs text-gray-500">Last updated: {lastUpdated}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
