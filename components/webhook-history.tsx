"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, ArrowUp, ArrowDown, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

type WebhookLog = {
  id: string
  ticker: string
  action: string
  quantity: string
  price?: string
  status: string
  trade_id?: string
  error_message?: string
  created_at: string
}

export function WebhookHistory() {
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "success" | "error">("all")

  const fetchLogs = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/webhook-logs")

      if (!response.ok) {
        throw new Error(`Error fetching webhook logs: ${response.status}`)
      }

      const data = await response.json()

      if (data.success && Array.isArray(data.logs)) {
        setLogs(data.logs)
      } else {
        // If no real data, use mock data
        setLogs(getMockLogs())
      }
    } catch (err) {
      console.error("Error fetching webhook logs:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
      // Use mock data on error
      setLogs(getMockLogs())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
    // Refresh logs every 60 seconds
    const interval = setInterval(fetchLogs, 60000)
    return () => clearInterval(interval)
  }, [])

  const filteredLogs = logs.filter((log) => {
    if (filter === "all") return true
    if (filter === "success") return log.status === "completed" || log.status === "filled"
    if (filter === "error") return log.status === "error" || log.status === "failed"
    return true
  })

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "filled":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Completed</Badge>
      case "error":
      case "failed":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/50">Failed</Badge>
      case "pending":
      case "processing":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">Processing</Badge>
      default:
        return <Badge className="bg-zinc-500/20 text-zinc-500 border-zinc-500/50">{status}</Badge>
    }
  }

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case "buy":
        return <ArrowUp className="h-4 w-4 text-green-500" />
      case "sell":
        return <ArrowDown className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-zinc-500" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "filled":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
      case "processing":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-zinc-500" />
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
          <CardTitle className="text-white">Webhook History</CardTitle>
          <CardDescription>Recent trading signals from TradingView</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white"
          onClick={fetchLogs}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue="all" onValueChange={(value) => setFilter(value as any)}>
          <TabsList className="grid grid-cols-3 mb-4 bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="all">All Signals</TabsTrigger>
            <TabsTrigger value="success">Successful</TabsTrigger>
            <TabsTrigger value="error">Failed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-0">
            {renderLogsList(filteredLogs)}
          </TabsContent>

          <TabsContent value="success" className="space-y-0">
            {renderLogsList(filteredLogs)}
          </TabsContent>

          <TabsContent value="error" className="space-y-0">
            {renderLogsList(filteredLogs)}
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-md p-3">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-red-400">{error}</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )

  function renderLogsList(logs: WebhookLog[]) {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <RefreshCw className="h-6 w-6 text-zinc-500 animate-spin" />
        </div>
      )
    }

    if (logs.length === 0) {
      return <div className="text-center py-8 text-zinc-500">No webhook logs found for the selected filter.</div>
    }

    return (
      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
        {logs.map((log) => (
          <div key={log.id} className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center">
                {getActionIcon(log.action)}
                <span className="ml-2 font-medium text-white">{log.ticker}</span>
                <span className="ml-2 text-sm text-zinc-400">
                  {log.quantity} @ {log.price || "Market"}
                </span>
              </div>
              <div className="flex items-center">{getStatusBadge(log.status)}</div>
            </div>

            <div className="mt-2 flex justify-between items-center text-xs">
              <div className="text-zinc-500">{formatTime(log.created_at)}</div>
              <div className="flex items-center">
                {getStatusIcon(log.status)}
                <span className="ml-1 text-zinc-400">
                  {log.trade_id ? `ID: ${log.trade_id.substring(0, 8)}...` : "No trade ID"}
                </span>
              </div>
            </div>

            {log.error_message && (
              <div className="mt-2 text-xs text-red-400 bg-red-500/10 p-2 rounded">{log.error_message}</div>
            )}
          </div>
        ))}
      </div>
    )
  }
}

// Mock data for development and fallback
function getMockLogs(): WebhookLog[] {
  return [
    {
      id: "1",
      ticker: "BTC-USD",
      action: "BUY",
      quantity: "0.01",
      price: "43250.50",
      status: "completed",
      trade_id: "ord-123456789abcdef",
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    },
    {
      id: "2",
      ticker: "ETH-USD",
      action: "SELL",
      quantity: "0.5",
      price: "2310.75",
      status: "completed",
      trade_id: "ord-987654321abcdef",
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    },
    {
      id: "3",
      ticker: "SOL-USD",
      action: "BUY",
      quantity: "5",
      status: "error",
      error_message: "Insufficient funds to execute order",
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    },
    {
      id: "4",
      ticker: "XRP-USD",
      action: "SELL",
      quantity: "100",
      price: "0.59",
      status: "pending",
      created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 minutes ago
    },
    {
      id: "5",
      ticker: "BTC-USD",
      action: "BUY",
      quantity: "0.005",
      price: "43150.25",
      status: "completed",
      trade_id: "ord-abcdef123456789",
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    },
  ]
}
