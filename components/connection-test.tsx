"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, CheckCircle, XCircle } from "lucide-react"

export function ConnectionTest() {
  const [isLoading, setIsLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [lastChecked, setLastChecked] = useState<string | null>(null)

  const runConnectionTest = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/connection-test")

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`)
      }

      const data = await response.json()
      setTestResults(data)
      setLastChecked(new Date().toLocaleTimeString())
    } catch (error) {
      console.error("Error running connection test:", error)
      setError(error instanceof Error ? error.message : "Unknown error")
    } finally {
      setIsLoading(false)
    }
  }

  // Run test on component mount
  useEffect(() => {
    runConnectionTest()
  }, [])

  return (
    <Card className="bg-black border-zinc-900 shadow-xl tech-glow">
      <CardHeader className="border-b border-zinc-900 pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-white">Connection Test</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white"
          onClick={runConnectionTest}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent className="pt-4">
        {error ? (
          <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3">
            <div className="text-sm text-red-400">Error: {error}</div>
          </div>
        ) : !testResults ? (
          <div className="text-center py-4">
            <p className="text-zinc-500">Running connection tests...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Environment Variables</h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center">
                  {testResults.environment.coinbaseApiKey ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span className="text-sm text-zinc-300">Coinbase API Key</span>
                </div>
                <div className="flex items-center">
                  {testResults.environment.coinbaseApiSecret ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span className="text-sm text-zinc-300">Coinbase API Secret</span>
                </div>
                <div className="flex items-center">
                  {testResults.environment.webhookSecret ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span className="text-sm text-zinc-300">Webhook Secret</span>
                </div>
                <div className="flex items-center">
                  {testResults.environment.accessPassword ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mr-2" />
                  )}
                  <span className="text-sm text-zinc-300">Access Password</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-zinc-400 mb-2">Coinbase API Connection</h3>
              <div
                className={`p-3 rounded-md ${testResults.coinbase.connected ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}
              >
                <div className="flex items-center">
                  {testResults.coinbase.connected ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                  )}
                  <div>
                    <p className={`text-sm ${testResults.coinbase.connected ? "text-green-400" : "text-red-400"}`}>
                      {testResults.coinbase.message}
                    </p>
                    {testResults.coinbase.connected && testResults.coinbase.productsCount && (
                      <p className="text-xs text-zinc-500 mt-1">
                        Available trading pairs: {testResults.coinbase.productsCount}
                      </p>
                    )}
                    {!testResults.coinbase.connected && testResults.coinbase.details && (
                      <p className="text-xs text-zinc-500 mt-1">{testResults.coinbase.details}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {lastChecked && (
              <div className="text-right">
                <span className="text-xs text-zinc-600">Last checked: {lastChecked}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
