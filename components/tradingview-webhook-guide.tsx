"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Copy, CheckCircle, ExternalLink, AlertTriangle, Info } from "lucide-react"

export function TradingViewWebhookGuide() {
  const [copied, setCopied] = useState<string | null>(null)
  const [webhookUrl, setWebhookUrl] = useState("")
  const [webhookSecret, setWebhookSecret] = useState("YOUR_WEBHOOK_SECRET")

  // Fetch the webhook secret placeholder from the server
  useEffect(() => {
    // We'll use a placeholder instead of the actual secret
    setWebhookSecret("YOUR_WEBHOOK_SECRET")
  }, [])

  // Get the base URL for the webhook
  const getBaseUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.origin
    }
    return ""
  }

  // Get the full webhook URL
  const getWebhookUrl = () => {
    const baseUrl = getBaseUrl()
    return `${baseUrl}/api/webhook`
  }

  // Copy text to clipboard
  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text)
      setCopied(id)
      setTimeout(() => setCopied(null), 2000)
    }
  }

  // Example alert message templates
  const alertTemplates = {
    basic: JSON.stringify(
      {
        passphrase: webhookSecret,
        ticker: "{{ticker}}",
        side: "{{strategy.order.action}}",
        quantity: "{{strategy.position_size}}",
        price: "{{close}}",
        strategy: "{{strategy.order.alert_message}}",
        timeframe: "{{interval}}",
      },
      null,
      2,
    ),

    advanced: JSON.stringify(
      {
        passphrase: webhookSecret,
        ticker: "{{ticker}}",
        exchange: "COINBASE",
        side: "{{strategy.order.action}}",
        quantity: "{{strategy.position_size}}",
        price: "{{close}}",
        strategy: "{{strategy.order.alert_message}}",
        timeframe: "{{interval}}",
        rsi: "{{rsi}}",
        volume: "{{volume}}",
        timestamp: "{{timenow}}",
      },
      null,
      2,
    ),

    pine: `// TradingView Pine Script Example
// This is a simple moving average crossover strategy

//@version=5
strategy("MA Crossover Strategy", overlay=true)

// Input parameters
fastLength = input(9, "Fast MA Length")
slowLength = input(21, "Slow MA Length")
riskPerc = input.float(1.0, "Risk %", minval=0.1, maxval=10, step=0.1)

// Calculate moving averages
fastMA = ta.sma(close, fastLength)
slowMA = ta.sma(close, slowLength)

// Plot moving averages
plot(fastMA, "Fast MA", color=color.blue)
plot(slowMA, "Slow MA", color=color.red)

// Define trading conditions
buySignal = ta.crossover(fastMA, slowMA)
sellSignal = ta.crossunder(fastMA, slowMA)

// Calculate position size based on risk percentage
price = close
capital = strategy.equity
riskAmount = capital * (riskPerc / 100)
positionSize = riskAmount / price

// Execute strategy
if (buySignal)
  strategy.entry("Buy", strategy.long, qty=positionSize)
  
if (sellSignal)
  strategy.close("Buy")

// Add alerts
alertcondition(buySignal, "Buy Signal", "MA Crossover - BUY")
alertcondition(sellSignal, "Sell Signal", "MA Crossover - SELL")

// This alert message will be sent to our webhook
if (buySignal)
  alert("Buy Signal Triggered", alert.freq_once_per_bar)
  
if (sellSignal)
  alert("Sell Signal Triggered", alert.freq_once_per_bar)
`,
  }

  return (
    <Card className="bg-black border-zinc-900 shadow-xl tech-glow">
      <CardHeader className="border-b border-zinc-900 pb-3">
        <CardTitle className="text-white">TradingView Webhook Setup Guide</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue="setup">
          <TabsList className="grid grid-cols-3 mb-4 bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="setup">Setup Guide</TabsTrigger>
            <TabsTrigger value="templates">Alert Templates</TabsTrigger>
            <TabsTrigger value="pine">Pine Script</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4">
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-blue-400">
                    <p>Follow these steps to set up TradingView alerts that trigger trades on your Coinbase account.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Step 1: Copy Your Webhook URL</h3>
                <div className="flex space-x-2">
                  <Input
                    value={getWebhookUrl()}
                    readOnly
                    className="bg-zinc-900 border-zinc-800 text-white font-mono text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(getWebhookUrl(), "webhook-url")}
                    className="shrink-0"
                  >
                    {copied === "webhook-url" ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  This is the URL you'll use in TradingView's webhook settings.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Step 2: Configure Your Webhook Secret</h3>
                <p className="text-sm text-zinc-400">
                  Your webhook secret is used to authenticate incoming webhook requests. Make sure it matches the value
                  in your environment variables.
                </p>
                <div className="bg-zinc-900 p-3 rounded-md font-mono text-xs break-all text-zinc-400">
                  WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Include this secret in your TradingView alert message as the "passphrase" field.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Step 3: Create a TradingView Alert</h3>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-zinc-400">
                  <li>Open TradingView and navigate to your chart</li>
                  <li>Click on the "Alerts" button in the right sidebar</li>
                  <li>Click "Create Alert" and configure your alert conditions</li>
                  <li>In the "Alert actions" section, select "Webhook URL"</li>
                  <li>Paste your webhook URL from Step 1</li>
                  <li>In the "Message" field, use one of the JSON templates from the "Alert Templates" tab</li>
                  <li>
                    Replace <code>YOUR_WEBHOOK_SECRET</code> with your actual webhook secret
                  </li>
                  <li>Click "Create" to save your alert</li>
                </ol>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Step 4: Test Your Alert</h3>
                <p className="text-sm text-zinc-400">
                  Before relying on your alerts for real trading, test them thoroughly:
                </p>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-zinc-400">
                  <li>Use the "Test Trade Utility" to verify your API connection</li>
                  <li>Manually trigger a TradingView alert to test the webhook integration</li>
                  <li>Start with very small trade sizes until you're confident the system works as expected</li>
                </ol>
              </div>

              <div className="mt-4">
                <Button
                  onClick={() =>
                    window.open("https://www.tradingview.com/support/solutions/43000529348-webhooks/", "_blank")
                  }
                  variant="outline"
                  className="flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  TradingView Webhook Documentation
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Basic Alert Template</h3>
                <p className="text-sm text-zinc-400">A simple template with the essential fields needed for trading.</p>
                <div className="relative">
                  <Textarea
                    value={alertTemplates.basic}
                    readOnly
                    className="min-h-[200px] font-mono text-sm bg-zinc-900 border-zinc-800 text-white"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(alertTemplates.basic, "basic-template")}
                    className="absolute top-2 right-2"
                  >
                    {copied === "basic-template" ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Advanced Alert Template</h3>
                <p className="text-sm text-zinc-400">
                  An extended template with additional fields for more detailed trading signals.
                </p>
                <div className="relative">
                  <Textarea
                    value={alertTemplates.advanced}
                    readOnly
                    className="min-h-[200px] font-mono text-sm bg-zinc-900 border-zinc-800 text-white"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(alertTemplates.advanced, "advanced-template")}
                    className="absolute top-2 right-2"
                  >
                    {copied === "advanced-template" ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy
                  </Button>
                </div>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3 mt-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-yellow-400">
                    <p>
                      Important: Replace <code>YOUR_WEBHOOK_SECRET</code> with your actual webhook secret.
                    </p>
                    <p className="mt-1 text-xs">
                      The other placeholders like <code>&#123;&#123;ticker&#125;&#125;</code> and{" "}
                      <code>&#123;&#123;strategy.order.action&#125;&#125;</code> will be automatically replaced by
                      TradingView.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="pine" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Example Pine Script Strategy</h3>
                <p className="text-sm text-zinc-400">
                  A simple moving average crossover strategy that generates alerts for buy and sell signals.
                </p>
                <div className="relative">
                  <Textarea
                    value={alertTemplates.pine}
                    readOnly
                    className="min-h-[400px] font-mono text-sm bg-zinc-900 border-zinc-800 text-white"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(alertTemplates.pine, "pine-script")}
                    className="absolute top-2 right-2"
                  >
                    {copied === "pine-script" ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Copy this script to TradingView's Pine Editor to create a strategy that generates alerts.
                </p>
              </div>

              <div className="mt-4">
                <Button
                  onClick={() =>
                    window.open("https://www.tradingview.com/pine-script-docs/en/v5/concepts/Alerts.html", "_blank")
                  }
                  variant="outline"
                  className="flex items-center"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Pine Script Alerts Documentation
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <div className="mt-4 bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
          <div className="flex items-start">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm text-blue-400">
              <p>
                For more detailed documentation and examples, check out our{" "}
                <a href="/dashboard/documentation" className="underline hover:text-white">
                  API Documentation
                </a>{" "}
                page.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
