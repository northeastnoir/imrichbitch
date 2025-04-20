"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, RefreshCw, Code, Copy, Check } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

export function WebhookTestTool() {
  const [symbol, setSymbol] = useState("BTC-USD")
  const [side, setSide] = useState("BUY")
  const [quantity, setQuantity] = useState("0.001")
  const [price, setPrice] = useState("")
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [webhookUrl, setWebhookUrl] = useState("")
  const [webhookSecret, setWebhookSecret] = useState("")
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState("simple")
  const [jsonPayload, setJsonPayload] = useState(
    JSON.stringify(
      {
        ticker: "BTC-USD",
        action: "BUY",
        quantity: "0.001",
        price: "",
      },
      null,
      2,
    ),
  )

  // Get the current domain for the webhook URL
  const getCurrentDomain = () => {
    if (typeof window !== "undefined") {
      return `${window.location.protocol}//${window.location.host}/api/tradingview-webhook`
    }
    return "/api/tradingview-webhook"
  }

  // Copy webhook URL to clipboard
  const copyWebhookUrl = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(getCurrentDomain())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Update JSON payload when form fields change
  const updateJsonPayload = () => {
    const payload = {
      ticker: symbol,
      action: side,
      quantity: quantity,
      price: price || undefined,
    }
    setJsonPayload(JSON.stringify(payload, null, 2))
  }

  // Handle simple form submission
  const handleSimpleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      // Create the order payload
      const payload = {
        ticker: symbol,
        action: side,
        quantity: quantity,
        price: price || undefined,
      }

      // Send the order to the webhook endpoint
      const response = await fetch("/api/tradingview-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${webhookSecret || ""}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()
      setResponse(data)

      if (!response.ok) {
        setError(data.message || data.error || "Error placing order")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  // Handle JSON form submission
  const handleJsonSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      // Parse the JSON payload
      const payload = JSON.parse(jsonPayload)

      // Send the order to the webhook endpoint
      const response = await fetch(webhookUrl || "/api/tradingview-webhook", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${webhookSecret || ""}`,
        },
        body: jsonPayload,
      })

      const data = await response.json()
      setResponse(data)

      if (!response.ok) {
        setError(data.message || data.error || "Error placing order")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-black border-zinc-900">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Code className="mr-2 h-5 w-5 text-[#b76e9b]" />
          Webhook Test Tool
        </CardTitle>
        <CardDescription>Test your TradingView webhook integration</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-md flex justify-between items-center">
          <div className="text-sm text-zinc-400 truncate">
            <span className="font-mono">{getCurrentDomain()}</span>
          </div>
          <Button variant="outline" size="sm" className="ml-2 bg-zinc-800 hover:bg-zinc-700" onClick={copyWebhookUrl}>
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <Tabs defaultValue="simple" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4 bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="simple">Simple</TabsTrigger>
            <TabsTrigger value="json">JSON</TabsTrigger>
          </TabsList>

          <TabsContent value="simple">
            <form onSubmit={handleSimpleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                  id="symbol"
                  value={symbol}
                  onChange={(e) => {
                    setSymbol(e.target.value)
                    if (activeTab === "simple") updateJsonPayload()
                  }}
                  placeholder="BTC-USD"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="side">Side</Label>
                  <Select
                    value={side}
                    onValueChange={(value) => {
                      setSide(value)
                      if (activeTab === "simple") updateJsonPayload()
                    }}
                  >
                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                      <SelectValue placeholder="Select side" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BUY">Buy</SelectItem>
                      <SelectItem value="SELL">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    value={quantity}
                    onChange={(e) => {
                      setQuantity(e.target.value)
                      if (activeTab === "simple") updateJsonPayload()
                    }}
                    placeholder="0.001"
                    className="bg-zinc-900 border-zinc-800"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (optional, leave empty for market orders)</Label>
                <Input
                  id="price"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value)
                    if (activeTab === "simple") updateJsonPayload()
                  }}
                  placeholder="Leave empty for market orders"
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookSecret">Webhook Secret (optional)</Label>
                <Input
                  id="webhookSecret"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="Enter webhook secret if required"
                  className="bg-zinc-900 border-zinc-800"
                  type="password"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className={`w-full ${
                  side === "BUY" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                } text-white`}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>Test Webhook</>
                )}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="json">
            <form onSubmit={handleJsonSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="jsonPayload">JSON Payload</Label>
                <Textarea
                  id="jsonPayload"
                  value={jsonPayload}
                  onChange={(e) => setJsonPayload(e.target.value)}
                  className="bg-zinc-900 border-zinc-800 font-mono h-48"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">Webhook URL (optional)</Label>
                <Input
                  id="webhookUrl"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder={getCurrentDomain()}
                  className="bg-zinc-900 border-zinc-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jsonWebhookSecret">Webhook Secret (optional)</Label>
                <Input
                  id="jsonWebhookSecret"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                  placeholder="Enter webhook secret if required"
                  className="bg-zinc-900 border-zinc-800"
                  type="password"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full bg-[#b76e9b] hover:bg-[#a25d8a] text-white">
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>Send JSON Payload</>
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-md p-3 text-sm text-red-400">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
              <div>{error}</div>
            </div>
          </div>
        )}

        {response && (
          <div className="mt-4 bg-green-500/10 border border-green-500/20 rounded-md p-3">
            <h3 className="text-sm font-medium text-green-400 mb-1">Response</h3>
            <pre className="text-xs text-green-300 overflow-auto max-h-48 bg-black/50 p-2 rounded">
              {JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
