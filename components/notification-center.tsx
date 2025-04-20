"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, RefreshCw, Info, AlertTriangle, AlertCircle, CheckCircle, Trash2 } from "lucide-react"
import { notifications } from "@/lib/notification-service"

type NotificationLevel = "info" | "warning" | "error" | "success"

interface NotificationProps {
  title: string
  message: string
  level: NotificationLevel
  timestamp: string
  data?: any
}

function NotificationItem({ title, message, level, timestamp, data }: NotificationProps) {
  const [expanded, setExpanded] = useState(false)

  // Get icon based on level
  const getIcon = () => {
    switch (level) {
      case "info":
        return <Info className="h-4 w-4 text-blue-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  // Get badge color based on level
  const getBadgeClass = () => {
    switch (level) {
      case "info":
        return "bg-blue-500/20 text-blue-500 border-blue-500/50"
      case "warning":
        return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50"
      case "error":
        return "bg-red-500/20 text-red-500 border-red-500/50"
      case "success":
        return "bg-green-500/20 text-green-500 border-green-500/50"
    }
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-3 mb-2">
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          <div className="mt-0.5 mr-2 flex-shrink-0">{getIcon()}</div>
          <div>
            <div className="font-medium text-white">{title}</div>
            <div className="text-sm text-zinc-400">{message}</div>
          </div>
        </div>
        <Badge className={getBadgeClass()}>{level.toUpperCase()}</Badge>
      </div>

      {data && (
        <div className="mt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-zinc-500 hover:text-zinc-300 p-0 h-auto"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Hide Details" : "Show Details"}
          </Button>

          {expanded && (
            <pre className="mt-2 p-2 bg-black/50 rounded text-xs text-zinc-400 overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      )}

      <div className="text-right mt-1">
        <span className="text-xs text-zinc-600">{new Date(timestamp).toLocaleString()}</span>
      </div>
    </div>
  )
}

export function NotificationCenter() {
  const [allNotifications, setAllNotifications] = useState<NotificationProps[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Load notifications
  const loadNotifications = () => {
    setIsLoading(true)

    // Get notifications from service
    const notifs = notifications.getNotifications()
    setAllNotifications(notifs)

    setIsLoading(false)
  }

  // Clear all notifications
  const clearNotifications = () => {
    notifications.clearNotifications()
    setAllNotifications([])
  }

  // Filter notifications by level
  const getFilteredNotifications = (level?: NotificationLevel) => {
    if (!level) return allNotifications
    return allNotifications.filter((n) => n.level === level)
  }

  // Load notifications on mount and every 30 seconds
  useEffect(() => {
    loadNotifications()

    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  // Generate test notifications (for development)
  const generateTestNotifications = () => {
    notifications.info("System Started", "The trading system has been initialized")
    notifications.success("Trade Executed", "Successfully bought 0.001 BTC at $43,250", {
      orderId: "test-123",
      status: "FILLED",
    })
    notifications.warning("API Rate Limit", "Approaching Coinbase API rate limit (80%)")
    notifications.error("Order Failed", "Failed to execute sell order for ETH-USD", { error: "Insufficient funds" })

    loadNotifications()
  }

  return (
    <Card className="bg-black border-zinc-900 shadow-xl tech-glow">
      <CardHeader className="border-b border-zinc-900 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-white flex items-center">
          <Bell className="mr-2 h-5 w-5 text-[#b76e9b]" />
          Notification Center
        </CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
            onClick={loadNotifications}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
            onClick={clearNotifications}
            disabled={allNotifications.length === 0}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue="all">
          <TabsList className="grid grid-cols-5 mb-4 bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="success">Success</TabsTrigger>
            <TabsTrigger value="warning">Warnings</TabsTrigger>
            <TabsTrigger value="error">Errors</TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <div className="max-h-[400px] overflow-y-auto pr-1">
              {allNotifications.length > 0 ? (
                allNotifications.map((notification, index) => <NotificationItem key={index} {...notification} />)
              ) : (
                <div className="text-center py-8 text-zinc-500">No notifications</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="info">
            <div className="max-h-[400px] overflow-y-auto pr-1">
              {getFilteredNotifications("info").length > 0 ? (
                getFilteredNotifications("info").map((notification, index) => (
                  <NotificationItem key={index} {...notification} />
                ))
              ) : (
                <div className="text-center py-8 text-zinc-500">No info notifications</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="success">
            <div className="max-h-[400px] overflow-y-auto pr-1">
              {getFilteredNotifications("success").length > 0 ? (
                getFilteredNotifications("success").map((notification, index) => (
                  <NotificationItem key={index} {...notification} />
                ))
              ) : (
                <div className="text-center py-8 text-zinc-500">No success notifications</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="warning">
            <div className="max-h-[400px] overflow-y-auto pr-1">
              {getFilteredNotifications("warning").length > 0 ? (
                getFilteredNotifications("warning").map((notification, index) => (
                  <NotificationItem key={index} {...notification} />
                ))
              ) : (
                <div className="text-center py-8 text-zinc-500">No warning notifications</div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="error">
            <div className="max-h-[400px] overflow-y-auto pr-1">
              {getFilteredNotifications("error").length > 0 ? (
                getFilteredNotifications("error").map((notification, index) => (
                  <NotificationItem key={index} {...notification} />
                ))
              ) : (
                <div className="text-center py-8 text-zinc-500">No error notifications</div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 pt-4 border-t border-zinc-900">
            <Button
              variant="outline"
              size="sm"
              onClick={generateTestNotifications}
              className="w-full text-zinc-400 hover:text-white"
            >
              Generate Test Notifications
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
