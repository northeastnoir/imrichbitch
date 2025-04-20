"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Activity } from "lucide-react"
import { monitoring } from "@/lib/monitoring-service"
import { ErrorBoundary } from "@/components/error-boundary"

export function SystemMonitor() {
  const [logs, setLogs] = useState<any[]>([])
  const [tradeEvents, setTradeEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [systemMetrics, setSystemMetrics] = useState({
    cpuUsage: 0,
    memoryUsage: 0,
    apiLatency: 0,
    uptime: 0,
  })

  // Refresh logs and trade events
  const refreshData = () => {
    setIsLoading(true)

    // Get logs and trade events from monitoring service
    setLogs(monitoring.getLogs())
    setTradeEvents(monitoring.getTradeEvents())

    // Simulate fetching system metrics
    setSystemMetrics({
      cpuUsage: Math.random() * 30, // Simulate 0-30% CPU usage
      memoryUsage: Math.random() * 40 + 20, // Simulate 20-60% memory usage
      apiLatency: Math.random() * 200 + 50, // Simulate 50-250ms API latency
      uptime: Math.floor(Date.now() / 1000) % 86400, // Simulate uptime in seconds (resets daily)
    })

    setIsLoading(false)
  }

  // Refresh on component mount and every 30 seconds
  useEffect(() => {
    refreshData()

    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [])

  // Format uptime
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Get badge color based on log level
  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case "debug":
        return <Badge className="bg-blue-500/20 text-blue-500 border-blue-500/50">DEBUG</Badge>
      case "info":
        return <Badge className="bg-green-500/20 text-green-500 border-green-500/50">INFO</Badge>
      case "warn":
        return <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">WARN</Badge>
      case "error":
        return <Badge className="bg-red-500/20 text-red-500 border-red-500/50">ERROR</Badge>
      default:
        return <Badge className="bg-zinc-500/20 text-zinc-500 border-zinc-500/50">{level.toUpperCase()}</Badge>
    }
  }

  return (
    <ErrorBoundary>
      <Card className="bg-black border-zinc-900 shadow-xl tech-glow">
        <CardHeader className="border-b border-zinc-900 pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Activity className="mr-2 h-5 w-5 text-[#b76e9b]" />
            System Monitor
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-3">
              <div className="text-xs text-zinc-500 mb-1">CPU Usage</div>
              <div className="text-lg font-medium text-white">{systemMetrics.cpuUsage.toFixed(1)}%</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-3">
              <div className="text-xs text-zinc-500 mb-1">Memory</div>
              <div className="text-lg font-medium text-white">{systemMetrics.memoryUsage.toFixed(1)}%</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-3">
              <div className="text-xs text-zinc-500 mb-1">API Latency</div>
              <div className="text-lg font-medium text-white">{systemMetrics.apiLatency.toFixed(0)}ms</div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-3">
              <div className="text-xs text-zinc-500 mb-1">Uptime</div>
              <div className="text-lg font-medium text-white">{formatUptime(systemMetrics.uptime)}</div>
            </div>
          </div>

          <Tabs defaultValue="logs">
            <TabsList className="grid grid-cols-2 mb-4 bg-zinc-900 border border-zinc-800">
              <TabsTrigger value="logs">System Logs</TabsTrigger>
              <TabsTrigger value="trades">Trade Events</TabsTrigger>
            </TabsList>

            <TabsContent value="logs">
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-md p-2 max-h-[300px] overflow-y-auto">
                {logs.length > 0 ? (
                  <div className="space-y-2">
                    {logs.map((log, index) => (
                      <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-md p-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400 text-xs">{new Date(log.timestamp).toLocaleTimeString()}</span>
                          {getLogLevelBadge(log.level)}
                        </div>
                        <div className="mt-1 text-white">{log.message}</div>
                        {log.data && (
                          <div className="mt-1 text-xs text-zinc-500 font-mono overflow-x-auto">
                            {JSON.stringify(log.data)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">No logs available</div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="trades">
              <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-md p-2 max-h-[300px] overflow-y-auto">
                {tradeEvents.length > 0 ? (
                  <div className="space-y-2">
                    {tradeEvents.map((event, index) => (
                      <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-md p-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400 text-xs">
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </span>
                          <Badge
                            className={`${
                              event.side === "BUY"
                                ? "bg-green-500/20 text-green-500 border-green-500/50"
                                : "bg-red-500/20 text-red-500 border-red-500/50"
                            }`}
                          >
                            {event.side}
                          </Badge>
                        </div>
                        <div className="mt-1 text-white">
                          {event.size} {event.productId} @ {event.price || "MARKET"}
                        </div>
                        <div className="mt-1 flex justify-between text-xs">
                          <span className="text-zinc-500">Order ID: {event.orderId.substring(0, 8)}...</span>
                          <span className="text-zinc-500">Status: {event.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500">No trade events available</div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </ErrorBoundary>
  )
}
