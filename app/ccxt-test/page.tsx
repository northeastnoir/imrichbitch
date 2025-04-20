"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, RefreshCw } from "lucide-react"

export default function CcxtTestPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testCcxtConnection = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ccxt-test")
      const data = await response.json()
      setResult(data)

      if (!data.success) {
        setError(data.message || "Failed to connect to Coinbase via CCXT")
      }
    } catch (error) {
      console.error("Error testing CCXT connection:", error)
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  // Test connection on page load
  useState(() => {
    testCcxtConnection()
  }, [])

  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">CCXT Connection Test</h1>

        <Card className="bg-black border-zinc-900 shadow-xl tech-glow">
          <CardHeader className="border-b border-zinc-900 pb-3 flex flex-row items-center justify-between">
            <CardTitle className="text-white">CCXT Coinbase Connection</CardTitle>
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-white"
              onClick={testCcxtConnection}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </CardHeader>
          <CardContent className="pt-4">
            {isLoading ? (
              <div className="text-center py-4">
                <p className="text-zinc-500">Testing CCXT connection...</p>
              </div>
            ) : result ? (
              <div>
                <div
                  className={`p-4 rounded-md ${result.success ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}
                >
                  <div className="flex items-start">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                    )}
                    <div>
                      <p className={`font-medium ${result.success ? "text-green-400" : "text-red-400"}`}>
                        {result.message}
                      </p>

                      {result.success && (
                        <div className="text-sm text-zinc-400 mt-2">
                          <p>Available markets: {result.marketsCount}</p>
                          <p>Current BTC/USD price: ${result.btcUsdPrice}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {result.success ? (
                  <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-md">
                    <h3 className="text-green-400 font-medium mb-2 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-2" /> CCXT is working correctly
                    </h3>
                    <p className="text-sm text-zinc-400">
                      You can now use the CCXT webhook endpoint to place orders from TradingView.
                    </p>
                    <div className="mt-4 bg-zinc-900 p-3 rounded-md font-mono text-xs break-all text-zinc-400">
                      Webhook URL:{" "}
                      {typeof window !== "undefined"
                        ? `${window.location.origin}/api/ccxt-webhook`
                        : "/api/ccxt-webhook"}
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                    <h3 className="text-yellow-400 font-medium mb-2">Troubleshooting Steps</h3>
                    <ul className="text-sm text-zinc-400 space-y-2 list-disc pl-5">
                      <li>Verify that you've added COINBASE_API_PASSPHRASE to your environment variables</li>
                      <li>Check that you've created API keys with the correct permissions</li>
                      <li>Ensure the API keys are from Coinbase Pro/Advanced Trade</li>
                      <li>Try regenerating new API keys if the current ones aren't working</li>
                    </ul>
                  </div>
                )}
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4">
                <div className="text-sm text-red-400">Error: {error}</div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
