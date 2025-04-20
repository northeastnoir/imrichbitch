"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CoinbaseStatusProps {
  onStatusChange?: (status: "online" | "offline" | "standby") => void
}

export function CoinbaseStatus({ onStatusChange }: CoinbaseStatusProps) {
  const [status, setStatus] = useState<"online" | "offline" | "standby">("standby")
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<string | null>(null)
  const [details, setDetails] = useState<any>(null)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/connection-test")
      const data = await response.json()

      if (data.success && data.coinbase?.connected) {
        setStatus("online")
        onStatusChange?.("online")
      } else {
        setStatus("offline")
        onStatusChange?.("offline")
      }

      setDetails(data)
      setLastChecked(new Date().toLocaleTimeString())
    } catch (error) {
      console.error("Error checking Coinbase status:", error)
      setStatus("offline")
      onStatusChange?.("offline")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkStatus()
    // Set up interval to check status every 5 minutes
    const interval = setInterval(checkStatus, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="bg-black border-zinc-900 shadow-xl tech-glow">
      <CardHeader className="border-b border-zinc-900 pb-3">
        <CardTitle className="text-white flex items-center">
          <div className="w-3 h-3 rounded-full mr-2 bg-gradient-to-r from-blue-500 to-cyan-400"></div>
          Coinbase API Status
        </CardTitle>
        <CardDescription className="text-zinc-600">Connection to Coinbase Exchange API</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {status === "online" && (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-500 font-medium">Connected</span>
              </>
            )}
            {status === "offline" && (
              <>
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-red-500 font-medium">Disconnected</span>
              </>
            )}
            {status === "standby" && (
              <>
                <RefreshCw className="h-5 w-5 text-yellow-500 animate-spin" />
                <span className="text-yellow-500 font-medium">Checking...</span>
              </>
            )}
          </div>
          <Badge
            className={`
            ${status === "online" ? "bg-green-500/20 text-green-500 border-green-500/50" : ""}
            ${status === "offline" ? "bg-red-500/20 text-red-500 border-red-500/50" : ""}
            ${status === "standby" ? "bg-yellow-500/20 text-yellow-500 border-yellow-500/50" : ""}
          `}
          >
            {status === "online" ? "ACTIVE" : status === "offline" ? "INACTIVE" : "CHECKING"}
          </Badge>
        </div>

        <div className="mt-6 space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
            <h3 className="text-xs font-medium text-zinc-400 mb-1">API Credentials</h3>
            <p className="text-sm font-medium text-white">
              {details?.environment?.coinbaseApiKey ? "Configured" : "Not Configured"}
            </p>
          </div>

          {status === "online" && details?.coinbase?.productsCount && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
              <h3 className="text-xs font-medium text-zinc-400 mb-1">Available Products</h3>
              <p className="text-sm font-medium text-white">{details.coinbase.productsCount}</p>
            </div>
          )}

          {status === "offline" && details?.coinbase?.message && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
              <h3 className="text-xs font-medium text-red-400 mb-1">Error Details</h3>
              <p className="text-sm font-medium text-red-300">{details.coinbase.message}</p>
              {details?.coinbase?.details && <p className="text-xs text-red-400 mt-1">{details.coinbase.details}</p>}
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="text-xs text-zinc-500">{lastChecked ? `Last checked: ${lastChecked}` : "Checking..."}</div>
          <Button
            variant="outline"
            size="sm"
            onClick={checkStatus}
            disabled={loading}
            className="text-xs h-7 px-2 bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
          >
            {loading ? (
              <>
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Checking...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-1" /> Refresh
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
