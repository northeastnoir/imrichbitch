"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, ArrowDownUp, RefreshCw } from "lucide-react"

export function TradingInterface() {
  const [symbol, setSymbol] = useState("BTC-USD")
  const [side, setSide] = useState("buy")
  const [quantity, setQuantity] = useState("0.001")
  const [price, setPrice] = useState("")
  const [orderType, setOrderType] = useState("market")
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      // Create the order payload
      const payload = {
        action: side,
        symbol,
        quantity: Number.parseFloat(quantity),
        ...(price && { price: Number.parseFloat(price) }),
        type: orderType,
        timeInForce: "IOC",
      }

      // Send the order to the webhook endpoint
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
        setError(data.message || "Error placing order")
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
          <ArrowDownUp className="mr-2 h-5 w-5 text-[#b76e9b]" />
          Trading Interface
        </CardTitle>
        <CardDescription>Execute trades directly on Coinbase</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="market" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4 bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="market">Market</TabsTrigger>
            <TabsTrigger value="limit">Limit</TabsTrigger>
          </TabsList>
          <TabsContent value="market">
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="side">Side</Label>
                  <Select value={side} onValueChange={setSide}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                      <SelectValue placeholder="Select side" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              </div>

              <Button
                type="submit"
                disabled={loading}
                className={`w-full ${
                  side === "buy" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                } text-white`}
                onClick={() => {
                  setOrderType("market")
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    {side === "buy" ? "Buy" : "Sell"} {symbol}
                  </>
                )}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="limit">
            <form onSubmit={handleSubmit} className="space-y-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="side">Side</Label>
                  <Select value={side} onValueChange={setSide}>
                    <SelectTrigger className="bg-zinc-900 border-zinc-800">
                      <SelectValue placeholder="Select side" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="buy">Buy</SelectItem>
                      <SelectItem value="sell">Sell</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Limit Price</Label>
                <Input
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Enter price"
                  className="bg-zinc-900 border-zinc-800"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className={`w-full ${
                  side === "buy" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                } text-white`}
                onClick={() => {
                  setOrderType("limit")
                }}
              >
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    {side === "buy" ? "Buy" : "Sell"} {symbol} at {price || "market price"}
                  </>
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
            <h3 className="text-sm font-medium text-green-400 mb-1">Order Submitted</h3>
            <pre className="text-xs text-green-300 overflow-auto max-h-32">{JSON.stringify(response, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
