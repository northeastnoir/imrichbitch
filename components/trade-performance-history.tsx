"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

type Trade = {
  id: string
  symbol: string
  side: "BUY" | "SELL"
  quantity: string
  price: string
  executedAt: string
  status: string
  pnl?: number
  pnlPercentage?: number
}

export function TradePerformanceHistory() {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchTrades = async (pageNum: number) => {
    try {
      setLoading(true)
      setError(null)

      // In a real implementation, you would fetch from your API
      // const response = await fetch(`/api/trade-history?page=${pageNum}&limit=10`)
      // const data = await response.json()

      // For now, we'll use mock data
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network delay
      const mockData = getMockTrades(pageNum)

      setTrades(mockData.trades)
      setTotalPages(mockData.totalPages)
    } catch (err) {
      console.error("Error fetching trades:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrades(page)
  }, [page])

  // Generate mock trades
  const getMockTrades = (pageNum: number) => {
    const tradesPerPage = 10
    const totalTrades = 35
    const totalPages = Math.ceil(totalTrades / tradesPerPage)

    const startIndex = (pageNum - 1) * tradesPerPage
    const endIndex = Math.min(startIndex + tradesPerPage, totalTrades)

    const mockTrades: Trade[] = []

    for (let i = startIndex; i < endIndex; i++) {
      const isBuy = Math.random() > 0.5
      const price = 40000 + (Math.random() * 5000 - 2500)
      const quantity = 0.001 + Math.random() * 0.01

      // For SELL trades, calculate PnL based on a fictional entry price
      let pnl, pnlPercentage
      if (!isBuy) {
        const entryPrice = price * (1 - (Math.random() * 0.1 - 0.05)) // Entry price ±5% of current price
        pnl = (price - entryPrice) * quantity
        pnlPercentage = ((price - entryPrice) / entryPrice) * 100
      }

      mockTrades.push({
        id: `ord-${(totalTrades - i).toString().padStart(6, "0")}`,
        symbol: Math.random() > 0.2 ? "BTC-USD" : Math.random() > 0.5 ? "ETH-USD" : "SOL-USD",
        side: isBuy ? "BUY" : "SELL",
        quantity: quantity.toFixed(6),
        price: price.toFixed(2),
        executedAt: new Date(Date.now() - i * 3600000 * 24).toISOString(), // Spread out over days
        status: Math.random() > 0.1 ? "FILLED" : Math.random() > 0.5 ? "CANCELED" : "FAILED",
        pnl: !isBuy ? pnl : undefined,
        pnlPercentage: !isBuy ? pnlPercentage : undefined,
      })
    }

    return {
      trades: mockTrades,
      totalPages,
    }
  }

  const formatTime = (timestamp: string) => {
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
    } catch (e) {
      return "Unknown time"
    }
  }

  return (
    <Card className="bg-black border-zinc-900 shadow-xl tech-glow">
      <CardHeader className="border-b border-zinc-900 pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white">Trade History</CardTitle>
          <CardDescription>Recent trades with performance data</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white"
          onClick={() => fetchTrades(page)}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {loading && trades.length === 0 ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin h-8 w-8 border-4 border-zinc-500 border-t-[#b76e9b] rounded-full"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-8">Error loading trades: {error}</div>
        ) : trades.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-400">Order ID</TableHead>
                    <TableHead className="text-zinc-400">Symbol</TableHead>
                    <TableHead className="text-zinc-400">Side</TableHead>
                    <TableHead className="text-zinc-400 text-right">Quantity</TableHead>
                    <TableHead className="text-zinc-400 text-right">Price</TableHead>
                    <TableHead className="text-zinc-400 text-right">P&L</TableHead>
                    <TableHead className="text-zinc-400">Time</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id} className="border-zinc-800/50">
                      <TableCell className="font-mono text-xs text-zinc-500">{trade.id}</TableCell>
                      <TableCell className="font-medium text-white">{trade.symbol}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {trade.side === "BUY" ? (
                            <ArrowUp className="h-4 w-4 text-green-500 mr-1" />
                          ) : (
                            <ArrowDown className="h-4 w-4 text-red-500 mr-1" />
                          )}
                          <span className={trade.side === "BUY" ? "text-green-500" : "text-red-500"}>{trade.side}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono">{trade.quantity}</TableCell>
                      <TableCell className="text-right font-mono">${trade.price}</TableCell>
                      <TableCell className="text-right">
                        {trade.pnl !== undefined ? (
                          <div className={trade.pnl >= 0 ? "text-green-500" : "text-red-500"}>
                            {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                            <span className="text-xs ml-1">
                              ({trade.pnl >= 0 ? "+" : ""}
                              {trade.pnlPercentage?.toFixed(2)}%)
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-500">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-zinc-500 text-sm">{formatTime(trade.executedAt)}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            trade.status === "FILLED"
                              ? "bg-green-500/20 text-green-500 border-green-500/50"
                              : trade.status === "CANCELED"
                                ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/50"
                                : "bg-red-500/20 text-red-500 border-red-500/50"
                          }
                        >
                          {trade.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-zinc-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                  className="h-8 w-8 p-0 bg-zinc-900 border-zinc-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages || loading}
                  className="h-8 w-8 p-0 bg-zinc-900 border-zinc-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-zinc-500 text-center py-8">No trade history available</div>
        )}
      </CardContent>
    </Card>
  )
}
