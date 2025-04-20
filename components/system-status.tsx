import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, AlertTriangle, CheckCircle, ExternalLink } from "lucide-react"

interface SystemStatusProps {
  status: "online" | "offline" | "standby"
}

export function SystemStatus({ status }: SystemStatusProps) {
  return (
    <Card className="bg-black border-zinc-900 shadow-xl tech-glow">
      <CardHeader className="border-b border-zinc-900 pb-3">
        <CardTitle className="text-white flex items-center">
          <Zap className="mr-2 h-5 w-5 text-[#b76e9b]" />
          System Status
        </CardTitle>
        <CardDescription className="text-zinc-600">Current operational status</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {status === "online" && (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-500 font-medium">System Online</span>
              </>
            )}
            {status === "offline" && (
              <>
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <span className="text-red-500 font-medium">System Offline</span>
              </>
            )}
            {status === "standby" && (
              <>
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="text-yellow-500 font-medium">System Standby</span>
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
            {status === "online" ? "ACTIVE" : status === "offline" ? "INACTIVE" : "INITIALIZING"}
          </Badge>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
            <h3 className="text-xs font-medium text-zinc-400 mb-1">Coinbase API</h3>
            <p className="text-sm font-medium text-white">
              {status === "online" ? "Connected" : status === "offline" ? "Disconnected" : "Connecting..."}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
            <h3 className="text-xs font-medium text-zinc-400 mb-1">Signal Processing</h3>
            <p className="text-sm font-medium text-white">
              {status === "online" ? "Active" : status === "offline" ? "Inactive" : "Initializing..."}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
            <h3 className="text-xs font-medium text-zinc-400 mb-1">Trading Engine</h3>
            <p className="text-sm font-medium text-white">
              {status === "online" ? "Ready" : status === "offline" ? "Stopped" : "Starting..."}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
            <h3 className="text-xs font-medium text-zinc-400 mb-1">ML Core</h3>
            <p className="text-sm font-medium text-white">
              {status === "online" ? "Operational" : status === "offline" ? "Offline" : "Loading..."}
            </p>
          </div>
        </div>

        {status === "offline" && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-md p-3">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-red-400">
                <p>System is offline. Please check your Coinbase API credentials in Vercel environment variables.</p>
                <div className="mt-2 text-xs flex items-center">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  <span>You can create API keys in your Coinbase Exchange account settings.</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
