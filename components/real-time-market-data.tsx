"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCoinbaseWebSocket } from "@/lib/coinbase-websocket"
import { ArrowDown, ArrowUp, AlertCircle } from "lucide-react"

type MarketData = {
  productId: string
  price: string
  change24h: string
  changePercent24h: string
  high24h: string
  low24h: string
  volume24h: string
  updated: string
}

export function RealTimeMarketData() {
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({})
  const productIds = ["BTC-USD", "ETH-USD", "SOL-USD", "XRP-USD"]

  const { isConnected, lastMessage, error } = useCoinbaseWebSocket(["market_data"], productIds)

  useEffect(() => {
    if (lastMessage && lastMessage.channel === "market_data") {
      const { product_id, updates } = lastMessage

      if (product_id && updates && updates.length > 0) {
        const update = updates[0]

        setMarketData((prev) => ({
          ...prev,
          [product_id]: {
            productId: product_id,
            price: update.price || prev[product_id]?.price || "0",
            change24h: update.price_24h_change || prev[product_id]?.change24h || "0",
            changePercent24h: update.price_24h_change_percentage || prev[product_id]?.changePercent24h || "0",
            high24h: update.high_24h || prev[product_id]?.high24h || "0",
            low24h: update.low_24h || prev[product_id]?.low24h || "0",
            volume24h: update.volume_24h || prev[product_id]?.volume24h || "0",
            updated: new Date().toISOString(),
          },
        }))
      }
    }
  }, [lastMessage])

  // Fallback to mock data if no real data is available
  useEffect(() => {
    if (Object.keys(marketData).length === 0) {
      // Initialize with mock data
      setMarketData({
        "BTC-USD": {
          productId: "BTC-USD",
          price: "43250.50",
          change24h: "1250.75",
          changePercent24h: "2.98",
          high24h: "43500.00",
          low24h: "41800.25",
          volume24h: "1250000000",
          updated: new Date().toISOString(),
        },
        "ETH-USD": {
          productId: "ETH-USD",
          price: "2310.75",
          change24h: "85.50",
          changePercent24h: "3.84",
          high24h: "2325.00",
          low24h: "2225.50",
          volume24h: "750000000",
          updated: new Date().toISOString(),
        },
        "SOL-USD": {
          productId: "SOL-USD",
          price: "145.25",
          change24h: "12.75",
          changePercent24h: "9.62",
          high24h: "148.50",
          low24h: "132.25",
          volume24h: "550000000",
          updated: new Date().toISOString(),
        },
        "XRP-USD": {
          productId: "XRP-USD",
          price: "0.59",
          change24h: "-0.03",
          changePercent24h: "-4.84",
          high24h: "0.63",
          low24h: "0.58",
          volume24h: "350000000",
          updated: new Date().toISOString(),
        },
      })
    }
  }, [])

  return (
    <Card className="bg-gray-100">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Real-Time Market Data</span>
          <div className="text-sm font-normal">
            {isConnected ? (
              <span className="text-green-600 flex items-center">
                <span className="h-2 w-2 rounded-full bg-green-600 mr-2 animate-pulse"></span>
                Live
              </span>
            ) : (
              <span className="text-amber-600 flex items-center">
                <span className="h-2 w-2 rounded-full bg-amber-600 mr-2"></span>
                Offline
              </span>
            )}
          </div>
        </CardTitle>
        <CardDescription>Current prices and 24h changes</CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-2 bg-red-50 text-red-700 rounded-md flex items-center">
            <AlertCircle className="h-4 w-4 mr-2" />
            <span>Error connecting to market data: {error.message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {productIds.map((id) => {
            const data = marketData[id]
            if (!data) return null

            const isPositive = Number.parseFloat(data.changePercent24h) >= 0
            return (
              <div key={id} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold">{id}</h3>
                  <span className={`flex items-center ${isPositive ? "text-green-600" : "text-red-600"}`}>
                    {isPositive ? <ArrowUp className="h-4 w-4 mr-1" /> : <ArrowDown className="h-4 w-4 mr-1" />}
                    {Math.abs(Number.parseFloat(data.changePercent24h)).toFixed(2)}%
                  </span>
                </div>
                <div className="text-2xl font-bold mb-2">${Number.parseFloat(data.price).toLocaleString()}</div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div>
                    <span className="block">24h High</span>
                    <span className="font-medium text-gray-700">
                      ${Number.parseFloat(data.high24h).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="block">24h Low</span>
                    <span className="font-medium text-gray-700">
                      ${Number.parseFloat(data.low24h).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="block">24h Volume</span>
                    <span className="font-medium text-gray-700">
                      ${(Number.parseFloat(data.volume24h) / 1000000).toFixed(2)}M
                    </span>
                  </div>
                  <div>
                    <span className="block">24h Change</span>
                    <span className={`font-medium ${isPositive ? "text-green-600" : "text-red-600"}`}>
                      ${Math.abs(Number.parseFloat(data.change24h)).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
