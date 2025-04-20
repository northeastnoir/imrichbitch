"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { AlertCircle, ArrowRight, Code, Copy, RefreshCw } from "lucide-react"

export function WebhookTester() {
  const [symbol, setSymbol] = useState("BTC-USD")
  const [action, setAction] = useState("buy")
  const [quantity, setQuantity] = useState("0.001")
  const [price, setPrice] = useState("")
  const [type, setType] = useState("market")
  const [timeInForce, setTimeInForce] = useState("IOC")
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const webhookUrl = typeof window !== "undefined" ? `${window.location.origin}/api/webhook` : "/api/webhook"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const payload = {
        action,
        symbol,
        quantity: Number.parseFloat(quantity),
        ...(price && { price: Number.parseFloat(price) }),
        type,
        timeInForce,
      }

      const response = await fetch("/api/webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      setResponse(data)

      if (!response.ok) {
        setError(data.message || "Error processing webhook")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
  }

  const generateTradingViewPineScript = () => {
    return `
// TradingView Pine Script Alert Example
// Add this to your TradingView indicator/strategy

// This function will be called when your alert triggers
alertcondition(condition, title="SUPER777 Trading Signal", message="{\\"action\\":\\"${action}\\",\\"symbol\\":\\"${symbol}\\",\\"quantity\\":${quantity},\\"type\\":\\"${type}\\",\\"timeInForce\\":\\"${timeInForce}\\"}")

// Example: Trigger when RSI crosses above 70
// rsi = rsi(close, 14)
// condition = crossover(rsi, 70)
    `.trim()
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-black border-zinc-900">
        <CardHeader>
          <CardTitle className="text-white">Webhook Tester</CardTitle>
          <CardDescription>Test your TradingView webhook integration</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="BTC-USD"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <Select value={action} onValueChange={setAction}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="sell">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="0.001"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (optional)</Label>
                <Input
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Leave empty for market price"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Order Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="market">Market</SelectItem>
                    <SelectItem value="limit">Limit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="timeInForce">Time In Force</Label>
                <Select value={timeInForce} onValueChange={setTimeInForce}>
                  <SelectTrigger className="bg-zinc-900 border-zinc-800">
                    <SelectValue placeholder="Select time in force" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IOC">Immediate or Cancel</SelectItem>
                    <SelectItem value="GTC">Good Till Cancelled</SelectItem>
                    <SelectItem value="GTT">Good Till Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-[#b76e9b] hover:bg-[#a25c89] text-white">
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Testing...
                </>
              ) : (
                <>Test Webhook</>
              )}
            </Button>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-md p-3 text-sm text-red-400">
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                  <div>{error}</div>
                </div>
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="bg-black border-zinc-900">
        <CardHeader>
          <CardTitle className="text-white">Webhook Configuration</CardTitle>
          <CardDescription>Use this URL in your TradingView alerts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Webhook URL</Label>
            <div className="flex">
              <Input readOnly value={webhookUrl} className="bg-zinc-900 border-zinc-800 rounded-r-none" />
              <Button type="button" onClick={copyWebhookUrl} className="rounded-l-none bg-zinc-800 hover:bg-zinc-700">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-zinc-500">Copy this URL to your TradingView alert webhook settings</p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>TradingView Pine Script Example</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs text-zinc-500"
                onClick={() => navigator.clipboard.writeText(generateTradingViewPineScript())}
              >
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
            <div className="relative">
              <Textarea
                readOnly
                value={generateTradingViewPineScript()}
                className="font-mono text-xs bg-zinc-900 border-zinc-800 h-32"
              />
              <Code className="absolute top-2 right-2 h-4 w-4 text-zinc-500" />
            </div>
            <p className="text-xs text-zinc-500">Add this to your TradingView indicator or strategy</p>
          </div>

          {response && (
            <div className="space-y-2 mt-4">
              <Label>Response</Label>
              <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
                <pre className="text-xs text-zinc-300 overflow-auto max-h-32">{JSON.stringify(response, null, 2)}</pre>
              </div>
            </div>
          )}

          <div className="pt-2">
            <div className="flex items-center space-x-2 text-sm">
              <ArrowRight className="h-4 w-4 text-[#b76e9b]" />
              <span>Set up a TradingView alert with the webhook URL and JSON payload</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
