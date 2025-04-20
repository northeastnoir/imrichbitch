"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { AlertCircle, CheckCircle, AlertTriangle, Beaker } from "lucide-react"
import { OrderSide } from "@/lib/trading-service"
import { TestUtils } from "@/lib/test-utils"

export function TestTradeInterface() {
  // Test configuration
  const [productId, setProductId] = useState("BTC-USD")
  const [side, setSide] = useState<OrderSide>(OrderSide.BUY)
  const [maxValue, setMaxValue] = useState("10")
  const [simulation, setSimulation] = useState(true)

  // Test status
  const [isLoading, setIsLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Available trading pairs
  const tradingPairs = ["BTC-USD", "ETH-USD", "SOL-USD", "XRP-USD", "ADA-USD"]

  // Execute test trade
  const executeTest = async () => {
    setIsLoading(true)
    setError(null)
    setTestResult(null)

    try {
      // First verify account access
      const accessCheck = await TestUtils.verifyAccountAccess()

      if (!accessCheck.success) {
        setError(`Account verification failed: ${accessCheck.message}`)
        setIsLoading(false)
        return
      }

      // Execute the test trade
      const result = await TestUtils.executeTestTrade(productId, side, Number.parseFloat(maxValue))

      setTestResult(result)

      if (!result.success) {
        setError(result.message)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error during test")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="bg-black border-zinc-900 shadow-xl tech-glow">
      <CardHeader className="border-b border-zinc-900 pb-3">
        <CardTitle className="text-white flex items-center">
          <Beaker className="mr-2 h-5 w-5 text-[#b76e9b]" />
          Test Trade Utility
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3">
            <div className="flex items-start">
              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-yellow-400">
                <p>This utility allows you to safely test your trading setup with minimal risk.</p>
                <p className="mt-1 text-xs">
                  Test trades use very small amounts (1/100th of your specified max value) to verify connectivity.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="product-id">Trading Pair</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger className="bg-zinc-900 border-zinc-800 text-white">
                <SelectValue placeholder="Select trading pair" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                {tradingPairs.map((pair) => (
                  <SelectItem key={pair} value={pair}>
                    {pair}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Button
              variant={side === OrderSide.BUY ? "default" : "outline"}
              className={side === OrderSide.BUY ? "bg-green-600 hover:bg-green-700" : "text-white"}
              onClick={() => setSide(OrderSide.BUY)}
            >
              Buy
            </Button>

            <Button
              variant={side === OrderSide.SELL ? "default" : "outline"}
              className={side === OrderSide.SELL ? "bg-red-600 hover:bg-red-700" : "text-white"}
              onClick={() => setSide(OrderSide.SELL)}
            >
              Sell
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="max-value">Maximum Value (USD)</Label>
            <Input
              id="max-value"
              type="number"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-white"
            />
            <p className="text-xs text-zinc-500">
              Actual test will use approximately ${(Number.parseFloat(maxValue) / 100).toFixed(2)} worth of{" "}
              {productId.split("-")[0]}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="simulation" checked={simulation} onCheckedChange={setSimulation} />
            <Label htmlFor="simulation">Simulation Mode (No Real Orders)</Label>
          </div>

          <Button
            onClick={executeTest}
            disabled={isLoading}
            className="w-full bg-[#b76e9b] hover:bg-[#a25d8a] text-white"
          >
            {isLoading ? "Testing..." : "Execute Test Trade"}
          </Button>

          {error && (
            <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-md p-3">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-red-400">{error}</div>
              </div>
            </div>
          )}

          {testResult && testResult.success && (
            <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-md p-3">
              <div className="flex items-start">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <div className="text-sm text-green-400">
                  <p>{testResult.message}</p>
                  {testResult.isSimulation && (
                    <p className="mt-1 text-xs">This was a simulated test. No real orders were placed.</p>
                  )}
                  {testResult.orderId && <p className="mt-1 text-xs">Order ID: {testResult.orderId}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
