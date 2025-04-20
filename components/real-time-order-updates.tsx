"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Clock, AlertCircle } from "lucide-react"

type Order = {
  id: string
  productId: string
  side: string
  size: string
  price: string
  status: string
  createdAt: string
}

export function RealTimeOrderUpdates() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading recent orders
    const timer = setTimeout(() => {
      setOrders([
        {
          id: "ORD-123456",
          productId: "BTC-USD",
          side: "buy",
          size: "0.05",
          price: "43250.50",
          status: "filled",
          createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        },
        {
          id: "ORD-123457",
          productId: "ETH-USD",
          side: "sell",
          size: "0.75",
          price: "2310.75",
          status: "open",
          createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
        },
        {
          id: "ORD-123458",
          productId: "SOL-USD",
          side: "buy",
          size: "10",
          price: "145.25",
          status: "filled",
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        },
      ])
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Function to safely get the order side with uppercase
  const getOrderSide = (side: string | undefined) => {
    return side ? side.toUpperCase() : "UNKNOWN"
  }

  // Function to format the timestamp
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleTimeString()
    } catch (e) {
      return "Unknown time"
    }
  }

  return (
    <Card className="bg-gray-100">
      <CardHeader>
        <CardTitle>Recent Orders</CardTitle>
        <CardDescription>Latest trading activity</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-pulse">Loading recent orders...</div>
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          getOrderSide(order.side) === "BUY" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        }
                      >
                        {getOrderSide(order.side)}
                      </Badge>
                      <span className="font-medium">{order.productId}</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {order.size} @ ${Number.parseFloat(order.price).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      {order.status === "filled" ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : order.status === "open" ? (
                        <Clock className="h-4 w-4 text-amber-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span
                        className={
                          order.status === "filled"
                            ? "text-green-600"
                            : order.status === "open"
                              ? "text-amber-600"
                              : "text-red-600"
                        }
                      >
                        {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "Unknown"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{formatTime(order.createdAt)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">No recent orders found.</div>
        )}
      </CardContent>
    </Card>
  )
}
