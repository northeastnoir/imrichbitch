"use client"

import { useEffect, useState, useRef } from "react"

// Function to create a WebSocket connection to Coinbase
export async function createCoinbaseWebSocket(channels: string[] = ["heartbeats"]) {
  try {
    // Create WebSocket connection
    const ws = new WebSocket("wss://advanced-trade-ws.coinbase.com")

    // Set up connection handlers
    ws.onopen = async () => {
      console.log("WebSocket connection opened")

      try {
        // Get JWT token from server-side API endpoint
        const response = await fetch("/api/coinbase/get-jwt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: "/ws",
            method: "GET",
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to get JWT token")
        }

        const { jwt } = await response.json()

        // Subscribe to channels
        const subscribeMessage = {
          type: "subscribe",
          jwt: jwt,
          channels: channels,
        }

        ws.send(JSON.stringify(subscribeMessage))
      } catch (error) {
        console.error("Error authenticating WebSocket:", error)
      }
    }

    ws.onclose = () => {
      console.log("WebSocket connection closed")
    }

    ws.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    return ws
  } catch (error) {
    console.error("Error creating Coinbase WebSocket:", error)
    throw error
  }
}

// Function to subscribe to market data
export async function subscribeToMarketData(productIds: string[] = ["BTC-USD"]) {
  try {
    const ws = await createCoinbaseWebSocket(["market_data"])

    // Set up message handler
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log("Received market data:", data)

        // Handle different message types
        if (data.type === "subscriptions") {
          console.log("Subscribed to channels:", data.channels)
        } else if (data.type === "market_data") {
          // Process market data
          console.log("Market data update:", data)
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error)
      }
    }

    // Subscribe to specific product IDs
    ws.onopen = async () => {
      try {
        // Get JWT token from server-side API endpoint
        const response = await fetch("/api/coinbase/get-jwt", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            path: "/ws",
            method: "GET",
          }),
        })

        if (!response.ok) {
          throw new Error("Failed to get JWT token")
        }

        const { jwt } = await response.json()

        const subscribeMessage = {
          type: "subscribe",
          product_ids: productIds,
          channels: ["market_data"],
          jwt: jwt,
        }

        ws.send(JSON.stringify(subscribeMessage))
      } catch (error) {
        console.error("Error subscribing to market data:", error)
      }
    }

    return ws
  } catch (error) {
    console.error("Error subscribing to market data:", error)
    throw error
  }
}

// React hook for using Coinbase WebSocket in components
export function useCoinbaseWebSocket(channels: string[] = ["heartbeats"], productIds: string[] = ["BTC-USD"]) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastMessage, setLastMessage] = useState<any>(null)
  const [error, setError] = useState<Error | null>(null)
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    let isMounted = true
    let reconnectTimer: NodeJS.Timeout | null = null

    async function connectWebSocket() {
      try {
        if (wsRef.current) {
          wsRef.current.close()
        }

        // Create WebSocket connection
        const ws = new WebSocket("wss://advanced-trade-ws.coinbase.com")
        wsRef.current = ws

        ws.onopen = async () => {
          if (!isMounted) return

          console.log("WebSocket connection opened")
          setIsConnected(true)
          setError(null)

          try {
            // Get JWT token from server-side API endpoint
            const response = await fetch("/api/coinbase/get-jwt", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                path: "/ws",
                method: "GET",
              }),
            })

            if (!response.ok) {
              throw new Error("Failed to get JWT token")
            }

            const { jwt } = await response.json()

            // Subscribe to channels
            const subscribeMessage = {
              type: "subscribe",
              jwt: jwt,
              channels: channels,
              product_ids: productIds,
            }

            ws.send(JSON.stringify(subscribeMessage))
          } catch (err) {
            console.error("Error authenticating WebSocket:", err)
            setError(err instanceof Error ? err : new Error("Authentication error"))
          }
        }

        ws.onmessage = (event) => {
          if (!isMounted) return

          try {
            const data = JSON.parse(event.data)
            setLastMessage(data)

            // Handle different message types
            if (data.type === "error") {
              console.error("WebSocket error message:", data)
              setError(new Error(data.message || "WebSocket error"))
            }
          } catch (err) {
            console.error("Error processing WebSocket message:", err)
          }
        }

        ws.onclose = () => {
          if (!isMounted) return

          console.log("WebSocket connection closed")
          setIsConnected(false)

          // Attempt to reconnect after 5 seconds
          reconnectTimer = setTimeout(() => {
            if (isMounted) {
              connectWebSocket()
            }
          }, 5000)
        }

        ws.onerror = (err) => {
          if (!isMounted) return

          console.error("WebSocket error:", err)
          setError(new Error("WebSocket connection error"))
          setIsConnected(false)
        }
      } catch (err) {
        if (!isMounted) return

        console.error("Error in connectWebSocket:", err)
        setError(err instanceof Error ? err : new Error("Unknown error"))
        setIsConnected(false)

        // Attempt to reconnect after 5 seconds
        reconnectTimer = setTimeout(() => {
          if (isMounted) {
            connectWebSocket()
          }
        }, 5000)
      }
    }

    connectWebSocket()

    // Cleanup function
    return () => {
      isMounted = false

      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }

      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [channels.join(","), productIds.join(",")]) // Reconnect if channels or productIds change

  // Function to send a message to the WebSocket
  const sendMessage = (message: any) => {
    if (wsRef.current && isConnected) {
      wsRef.current.send(JSON.stringify(message))
    } else {
      console.error("Cannot send message, WebSocket is not connected")
    }
  }

  return {
    isConnected,
    lastMessage,
    error,
    sendMessage,
  }
}
