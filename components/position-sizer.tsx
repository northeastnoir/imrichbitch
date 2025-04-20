"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Calculator, RefreshCw } from "lucide-react"

export function PositionSizer() {
  const [accountBalance, setAccountBalance] = useState("10000")
  const [riskPercentage, setRiskPercentage] = useState(1)
  const [entryPrice, setEntryPrice] = useState("50000")
  const [stopLossPrice, setStopLossPrice] = useState("49000")
  const [symbol, setSymbol] = useState("BTC-USD")
  const [loading, setLoading] = useState(false)
  const [positionSize, setPositionSize] = useState<number | null>(null)
  const [riskAmount, setRiskAmount] = useState<number | null>(null)
  const [stopLossPercentage, setStopLossPercentage] = useState<number | null>(null)

  const calculatePositionSize = () => {
    const balance = Number.parseFloat(accountBalance)
    const entry = Number.parseFloat(entryPrice)
    const stop = Number.parseFloat(stopLossPrice)

    if (isNaN(balance) || isNaN(entry) || isNaN(stop) || entry === stop) {
      setPositionSize(null)
      setRiskAmount(null)
      setStopLossPercentage(null)
      return
    }

    // Calculate risk amount
    const risk = (balance * riskPercentage) / 100
    setRiskAmount(risk)

    // Calculate stop loss percentage
    const stopPercentage = Math.abs(((stop - entry) / entry) * 100)
    setStopLossPercentage(stopPercentage)

    // Calculate position size
    const size = risk / stopPercentage
    setPositionSize(size * 100)
  }

  useEffect(() => {
    calculatePositionSize()
  }, [accountBalance, riskPercentage, entryPrice, stopLossPrice])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    calculatePositionSize()
  }

  return (
    <Card className="bg-black border-zinc-900">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Calculator className="mr-2 h-5 w-5 text-[#b76e9b]" />
          Position Sizer
        </CardTitle>
        <CardDescription>Calculate optimal position size based on risk</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountBalance">Account Balance ($)</Label>
              <Input
                id="accountBalance"
                value={accountBalance}
                onChange={(e) => setAccountBalance(e.target.value)}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="symbol">Trading Pair</Label>
              <Select value={symbol} onValueChange={setSymbol}>
                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                  <SelectValue placeholder="Select symbol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BTC-USD">BTC-USD</SelectItem>
                  <SelectItem value="ETH-USD">ETH-USD</SelectItem>
                  <SelectItem value="SOL-USD">SOL-USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="riskPercentage">Risk Percentage</Label>
              <span className="text-sm text-zinc-400">{riskPercentage}%</span>
            </div>
            <Slider
              id="riskPercentage"
              min={0.1}
              max={5}
              step={0.1}
              value={[riskPercentage]}
              onValueChange={(value) => setRiskPercentage(value[0])}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-zinc-500">
              <span>0.1%</span>
              <span>2.5%</span>
              <span>5%</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="entryPrice">Entry Price ($)</Label>
              <Input
                id="entryPrice"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stopLossPrice">Stop Loss Price ($)</Label>
              <Input
                id="stopLossPrice"
                value={stopLossPrice}
                onChange={(e) => setStopLossPrice(e.target.value)}
                className="bg-zinc-900 border-zinc-800"
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-[#b76e9b] hover:bg-[#a25c89] text-white">
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Calculating...
              </>
            ) : (
              <>Calculate Position Size</>
            )}
          </Button>
        </form>

        {positionSize !== null && riskAmount !== null && stopLossPercentage !== null && (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
                <h3 className="text-xs font-medium text-zinc-400 mb-1">Position Size</h3>
                <p className="text-lg font-medium text-white">${positionSize.toFixed(2)}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {(positionSize / Number.parseFloat(entryPrice)).toFixed(6)} {symbol.split("-")[0]}
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
                <h3 className="text-xs font-medium text-zinc-400 mb-1">Risk Amount</h3>
                <p className="text-lg font-medium text-white">${riskAmount.toFixed(2)}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  {riskPercentage}% of ${accountBalance}
                </p>
              </div>
              <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
                <h3 className="text-xs font-medium text-zinc-400 mb-1">Stop Loss</h3>
                <p className="text-lg font-medium text-white">{stopLossPercentage.toFixed(2)}%</p>
                <p className="text-xs text-zinc-500 mt-1">
                  ${entryPrice} → ${stopLossPrice}
                </p>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
              <h3 className="text-xs font-medium text-zinc-400 mb-1">Summary</h3>
              <p className="text-sm text-zinc-300">
                For a {riskPercentage}% risk on your ${accountBalance} account, you should invest{" "}
                <span className="text-white font-medium">${positionSize.toFixed(2)}</span> or{" "}
                <span className="text-white font-medium">
                  {(positionSize / Number.parseFloat(entryPrice)).toFixed(6)} {symbol.split("-")[0]}
                </span>{" "}
                with a stop loss at ${stopLossPrice}.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
