"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type PerformanceMetrics = {
  totalTrades: number
  winRate: number
  profitLoss: number
  profitLossPercentage: number
  averageTradeSize: number
  largestWin: number
  largestLoss: number
  averageHoldingTime: string
  successfulTrades: number
  failedTrades: number
}

type TimeRange = "day" | "week" | "month" | "year" | "all"

export function PerformanceMetrics() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<TimeRange>("month")

  const fetchMetrics = async (range: TimeRange) => {
    try {
      setLoading(true)
      setError(null)

      // In a real implementation, you would fetch from your API with the time range
      // const data = await cachedFetch<any>(
      //   `/api/trading-metrics?range=${range}`,
      //   {},
      //   { duration: 60000 }
      // )

      // For now, we'll use mock data
      const mockData = getMockMetrics(range)
      setMetrics(mockData)
    } catch (err) {
      console.error("Error fetching metrics:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics(timeRange)
  }, [timeRange])

  // Generate mock metrics based on time range
  const getMockMetrics = (range: TimeRange): PerformanceMetrics => {
    // Adjust metrics based on time range
    const multiplier =
      range === "day" ? 1 : range === "week" ? 7 : range === "month" ? 30 : range === "year" ? 365 : 100

    return {
      totalTrades: Math.floor(5 * multiplier),
      winRate: 58 + (Math.random() * 10 - 5), // 53-63%
      profitLoss: Math.round(120 * multiplier * (1 + (Math.random() * 0.4 - 0.2))), // Vary by ±20%
      profitLossPercentage: 3.5 + (Math.random() * 2 - 1), // 2.5-4.5%
      averageTradeSize: 0.015 + (Math.random() * 0.01 - 0.005), // 0.01-0.02 BTC
      largestWin: Math.round(50 * multiplier * (1 + Math.random() * 0.3)), // Vary by +30%
      largestLoss: Math.round(-30 * multiplier * (1 + Math.random() * 0.3)), // Vary by +30%
      averageHoldingTime:
        range === "day" ? "2.5 hours" : range === "week" ? "5.2 hours" : range === "month" ? "8.7 hours" : "12.3 hours",
      successfulTrades: Math.floor(3 * multiplier),
      failedTrades: Math.floor(2 * multiplier),
    }
  }

  return (
    <Card className="bg-black border-zinc-900 shadow-xl tech-glow">
      <CardHeader className="border-b border-zinc-900 pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white">Performance Metrics</CardTitle>
          <CardDescription>Trading performance statistics</CardDescription>
        </div>
        <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
            <TabsTrigger value="year">Year</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin h-8 w-8 border-4 border-zinc-500 border-t-[#b76e9b] rounded-full"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-8">Error loading metrics: {error}</div>
        ) : metrics ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Key Metrics */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-4 flex flex-col">
              <div className="text-zinc-500 text-sm mb-1">Total Trades</div>
              <div className="text-white text-2xl font-bold">{metrics.totalTrades}</div>
              <div className="mt-auto pt-2 text-xs text-zinc-500">
                {metrics.successfulTrades} successful / {metrics.failedTrades} failed
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-4 flex flex-col">
              <div className="text-zinc-500 text-sm mb-1">Win Rate</div>
              <div className="text-white text-2xl font-bold">{metrics.winRate.toFixed(1)}%</div>
              <div className="mt-auto pt-2 text-xs text-zinc-500">
                Average holding time: {metrics.averageHoldingTime}
              </div>
            </div>

            <div
              className={`bg-zinc-900/50 border border-zinc-800/50 rounded-md p-4 flex flex-col ${
                metrics.profitLoss >= 0 ? "border-green-800/30" : "border-red-800/30"
              }`}
            >
              <div className="text-zinc-500 text-sm mb-1">Profit/Loss</div>
              <div className={`text-2xl font-bold ${metrics.profitLoss >= 0 ? "text-green-500" : "text-red-500"}`}>
                ${Math.abs(metrics.profitLoss).toLocaleString()}
                <span className="text-sm ml-1">
                  ({metrics.profitLoss >= 0 ? "+" : "-"}
                  {Math.abs(metrics.profitLossPercentage).toFixed(2)}%)
                </span>
              </div>
              <div className="mt-auto pt-2 text-xs text-zinc-500">
                Avg. trade size: {metrics.averageTradeSize.toFixed(4)} BTC
              </div>
            </div>

            {/* Additional Metrics */}
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-4 col-span-1 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-zinc-500 text-sm mb-1">Largest Win</div>
                <div className="text-green-500 text-xl font-bold">+${metrics.largestWin.toLocaleString()}</div>
              </div>

              <div>
                <div className="text-zinc-500 text-sm mb-1">Largest Loss</div>
                <div className="text-red-500 text-xl font-bold">${metrics.largestLoss.toLocaleString()}</div>
              </div>

              <div>
                <div className="text-zinc-500 text-sm mb-1">Success Rate</div>
                <div className="text-white text-xl font-bold">
                  {((metrics.successfulTrades / metrics.totalTrades) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-zinc-500 text-center py-8">No metrics available</div>
        )}
      </CardContent>
    </Card>
  )
}
