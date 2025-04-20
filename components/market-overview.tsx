"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, TrendingDown, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface MarketData {
  symbol: string
  price: number
  change24h: number
  volume24h: number
  marketCap?: number
}

export function MarketOverview() {
  const [markets, setMarkets] = useState<MarketData[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  // Mock data for demonstration
  const mockMarketData: MarketData[] = [
    {
      symbol: "BTC/USD",
      price: 43250.5,
      change24h: 2.3,
      volume24h: 28500000000,
      marketCap: 845000000000,
    },
    {
      symbol: "ETH/USD",
      price: 2310.75,
      change24h: 1.8,
      volume24h: 15700000000,
      marketCap: 278000000000,
    },
    {
      symbol: "XRP/USD",
      price: 0.59,
      change24h: -3.2,
      volume24h: 1850000000,
      marketCap: 31500000000,
    },
    {
      symbol: "SOL/USD",
      price: 138.25,
      change24h: 5.7,
      volume24h: 3250000000,
      marketCap: 59800000000,
    },
    {
      symbol: "ADA/USD",
      price: 0.45,
      change24h: -1.2,
      volume24h: 980000000,
      marketCap: 15900000000,
    },
    {
      symbol: "DOGE/USD",
      price: 0.12,
      change24h: 8.5,
      volume24h: 2100000000,
      marketCap: 16800000000,
    },
    {
      symbol: "DOT/USD",
      price: 6.85,
      change24h: -0.8,
      volume24h: 450000000,
      marketCap: 8700000000,
    },
    {
      symbol: "LINK/USD",
      price: 15.35,
      change24h: 3.1,
      volume24h: 780000000,
      marketCap: 8900000000,
    },
  ]

  const fetchMarketData = async () => {
    setIsLoading(true)
    try {
      // In a real app, you would fetch from an API
      // For now, we'll use mock data with a slight delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Add some randomness to the mock data
      const updatedData = mockMarketData.map((coin) => ({
        ...coin,
        price: coin.price * (1 + (Math.random() * 0.02 - 0.01)), // +/- 1%
        change24h: coin.change24h + (Math.random() * 1 - 0.5), // +/- 0.5%
      }))

      setMarkets(updatedData)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (error) {
      console.error("Error fetching market data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    fetchMarketData()

    // Refresh every 30 seconds
    const interval = setInterval(fetchMarketData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Format currency
  const formatUSD = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: value < 1 ? 4 : 2,
      maximumFractionDigits: value < 1 ? 4 : 2,
    }).format(value)
  }

  // Format large numbers
  const formatLargeNumber = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toFixed(1)}B`
    }
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`
    }
    return formatUSD(value)
  }

  return (
    <Card className="bg-black border-zinc-900 shadow-xl tech-glow">
      <CardHeader className="border-b border-zinc-900 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-white">Market Overview</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white"
          onClick={fetchMarketData}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue="all">
          <TabsList className="grid grid-cols-3 mb-4 bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="gainers">Gainers</TabsTrigger>
            <TabsTrigger value="losers">Losers</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {markets.map((coin) => (
                <div
                  key={coin.symbol}
                  className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-3 flex justify-between items-center"
                >
                  <div>
                    <div className="font-medium text-white">{coin.symbol}</div>
                    <div className="text-sm text-zinc-400">Vol: {formatLargeNumber(coin.volume24h)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-white">{formatUSD(coin.price)}</div>
                    <div
                      className={`text-sm flex items-center justify-end ${
                        coin.change24h >= 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {coin.change24h >= 0 ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {coin.change24h >= 0 ? "+" : ""}
                      {coin.change24h.toFixed(2)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gainers" className="space-y-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {markets
                .filter((coin) => coin.change24h > 0)
                .sort((a, b) => b.change24h - a.change24h)
                .map((coin) => (
                  <div
                    key={coin.symbol}
                    className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-3 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-white">{coin.symbol}</div>
                      <div className="text-sm text-zinc-400">Vol: {formatLargeNumber(coin.volume24h)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-white">{formatUSD(coin.price)}</div>
                      <div className="text-sm flex items-center justify-end text-green-400">
                        <TrendingUp className="h-3 w-3 mr-1" />+{coin.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="losers" className="space-y-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {markets
                .filter((coin) => coin.change24h < 0)
                .sort((a, b) => a.change24h - b.change24h)
                .map((coin) => (
                  <div
                    key={coin.symbol}
                    className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-3 flex justify-between items-center"
                  >
                    <div>
                      <div className="font-medium text-white">{coin.symbol}</div>
                      <div className="text-sm text-zinc-400">Vol: {formatLargeNumber(coin.volume24h)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-white">{formatUSD(coin.price)}</div>
                      <div className="text-sm flex items-center justify-end text-red-400">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        {coin.change24h.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>

        {lastUpdated && <div className="text-xs text-zinc-700 text-right mt-4">Last updated: {lastUpdated}</div>}
      </CardContent>
    </Card>
  )
}
