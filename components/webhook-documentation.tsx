"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Copy, CheckCircle, ExternalLink, AlertTriangle, Info } from "lucide-react"

export function WebhookDocumentation() {
  const [copied, setCopied] = useState<string | null>(null)
  const [webhookUrl, setWebhookUrl] = useState("")
  const [webhookSecret, setWebhookSecret] = useState("YOUR_WEBHOOK_SECRET")

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

  // Example webhook payloads
  const examplePayloads = {
    basic: JSON.stringify(
      {
        passphrase: webhookSecret,
        ticker: "BTC-USD",
        action: "buy",
        quantity: "0.001",
        price: "43250.50",
      },
      null,
      2,
    ),

    advanced: JSON.stringify(
      {
        passphrase: webhookSecret,
        ticker: "BTC-USD",
        action: "buy",
        quantity: "0.001",
        price: "43250.50",
        type: "market",
        timeInForce: "IOC",
        strategy: "Golden Cross",
        timeframe: "1h",
      },
      null,
      2,
    ),

    tradingview: JSON.stringify(
      {
        passphrase: webhookSecret,
        ticker: "{{ticker}}",
        action: "{{strategy.order.action}}",
        quantity: "{{strategy.position_size}}",
        price: "{{close}}",
        strategy: "{{strategy.order.alert_message}}",
        timeframe: "{{interval}}",
      },
      null,
      2,
    ),
  }

  return (
    <Card className="bg-black border-zinc-900 shadow-xl tech-glow">
      <CardHeader className="border-b border-zinc-900 pb-3">
        <CardTitle className="text-white">Webhook API Documentation</CardTitle>
        <CardDescription>Learn how to integrate with the SUPER777 trading system</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue="overview">
          <TabsList className="grid grid-cols-4 mb-4 bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
            <TabsTrigger value="tradingview">TradingView</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-blue-400">
                    <p>
                      The SUPER777 webhook API allows you to execute trades on Coinbase by sending HTTP POST requests to
                      our webhook endpoint.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Webhook URL</h3>
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
                <p className="text-xs text-zinc-500 mt-1">This is the URL you'll use to send webhook requests.</p>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Request Format</h3>
                <p className="text-sm text-zinc-400">
                  All requests should be sent as HTTP POST with a JSON body containing the following fields:
                </p>
                <div className="bg-zinc-900 p-4 rounded-md mt-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left py-2 text-zinc-400">Field</th>
                        <th className="text-left py-2 text-zinc-400">Type</th>
                        <th className="text-left py-2 text-zinc-400">Required</th>
                        <th className="text-left py-2 text-zinc-400">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      <tr>
                        <td className="py-2 text-white font-mono">passphrase</td>
                        <td className="py-2 text-zinc-400">string</td>
                        <td className="py-2 text-zinc-400">Yes</td>
                        <td className="py-2 text-zinc-400">Your webhook secret for authentication</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-white font-mono">ticker</td>
                        <td className="py-2 text-zinc-400">string</td>
                        <td className="py-2 text-zinc-400">Yes</td>
                        <td className="py-2 text-zinc-400">Trading pair (e.g., "BTC-USD")</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-white font-mono">action</td>
                        <td className="py-2 text-zinc-400">string</td>
                        <td className="py-2 text-zinc-400">Yes</td>
                        <td className="py-2 text-zinc-400">"buy" or "sell"</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-white font-mono">quantity</td>
                        <td className="py-2 text-zinc-400">string/number</td>
                        <td className="py-2 text-zinc-400">Yes</td>
                        <td className="py-2 text-zinc-400">Amount to buy/sell</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-white font-mono">price</td>
                        <td className="py-2 text-zinc-400">string/number</td>
                        <td className="py-2 text-zinc-400">No</td>
                        <td className="py-2 text-zinc-400">Price for limit orders (optional)</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-white font-mono">type</td>
                        <td className="py-2 text-zinc-400">string</td>
                        <td className="py-2 text-zinc-400">No</td>
                        <td className="py-2 text-zinc-400">"market" (default) or "limit"</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Response Format</h3>
                <p className="text-sm text-zinc-400">The API will respond with a JSON object containing:</p>
                <div className="bg-zinc-900 p-4 rounded-md mt-2">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        <th className="text-left py-2 text-zinc-400">Field</th>
                        <th className="text-left py-2 text-zinc-400">Type</th>
                        <th className="text-left py-2 text-zinc-400">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      <tr>
                        <td className="py-2 text-white font-mono">success</td>
                        <td className="py-2 text-zinc-400">boolean</td>
                        <td className="py-2 text-zinc-400">Whether the request was successful</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-white font-mono">message</td>
                        <td className="py-2 text-zinc-400">string</td>
                        <td className="py-2 text-zinc-400">Description of the result</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-white font-mono">order</td>
                        <td className="py-2 text-zinc-400">object</td>
                        <td className="py-2 text-zinc-400">Order details if successful</td>
                      </tr>
                      <tr>
                        <td className="py-2 text-white font-mono">timestamp</td>
                        <td className="py-2 text-zinc-400">string</td>
                        <td className="py-2 text-zinc-400">ISO timestamp of the response</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="authentication" className="space-y-4">
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-md p-3">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-yellow-400">
                    <p>
                      Authentication is required to use the webhook API. You must include your webhook secret in each
                      request.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Webhook Secret</h3>
                <p className="text-sm text-zinc-400">
                  Your webhook secret is used to authenticate incoming webhook requests. Make sure it matches the value
                  in your environment variables.
                </p>
                <div className="bg-zinc-900 p-3 rounded-md font-mono text-xs break-all text-zinc-400 mt-2">
                  WEBHOOK_SECRET=YOUR_WEBHOOK_SECRET
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Include this secret in your webhook payload as the "passphrase" field.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Authentication Methods</h3>
                <p className="text-sm text-zinc-400">There are two ways to authenticate your webhook requests:</p>
                <div className="space-y-3 mt-2">
                  <div className="bg-zinc-900 p-3 rounded-md">
                    <h4 className="text-sm font-medium text-white mb-1">1. Passphrase in JSON Body</h4>
                    <p className="text-xs text-zinc-400">Include the "passphrase" field in your JSON request body:</p>
                    <pre className="mt-2 bg-zinc-800 p-2 rounded text-xs text-zinc-300 overflow-x-auto">
                      {`{
 "passphrase": "YOUR_WEBHOOK_SECRET",
 "ticker": "BTC-USD",
 "action": "buy",
 ...
}`}
                    </pre>
                  </div>

                  <div className="bg-zinc-900 p-3 rounded-md">
                    <h4 className="text-sm font-medium text-white mb-1">2. Signature Header (Advanced)</h4>
                    <p className="text-xs text-zinc-400">
                      For more secure integrations, you can sign your requests with HMAC-SHA256:
                    </p>
                    <pre className="mt-2 bg-zinc-800 p-2 rounded text-xs text-zinc-300 overflow-x-auto">
                      {`// JavaScript example
const crypto = require('crypto');
const payload = JSON.stringify(webhookData);
const hmacSignature = crypto
 .createHmac('sha256', 'YOUR_WEBHOOK_SECRET')
 .update(payload)
 .digest('hex');

// Add this header to your request
// x-tradingview-webhook-signature: <computed-signature>`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="examples" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Basic Example</h3>
                <p className="text-sm text-zinc-400">A simple market order to buy Bitcoin:</p>
                <div className="relative">
                  <Textarea
                    value={examplePayloads.basic}
                    readOnly
                    className="min-h-[200px] font-mono text-sm bg-zinc-900 border-zinc-800 text-white"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(examplePayloads.basic, "basic-payload")}
                    className="absolute top-2 right-2"
                  >
                    {copied === "basic-payload" ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Advanced Example</h3>
                <p className="text-sm text-zinc-400">A more detailed example with additional fields:</p>
                <div className="relative">
                  <Textarea
                    value={examplePayloads.advanced}
                    readOnly
                    className="min-h-[200px] font-mono text-sm bg-zinc-900 border-zinc-800 text-white"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(examplePayloads.advanced, "advanced-payload")}
                    className="absolute top-2 right-2"
                  >
                    {copied === "advanced-payload" ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Code Examples</h3>
                <div className="bg-zinc-900 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-white mb-1">JavaScript / Node.js</h4>
                  <pre className="bg-zinc-800 p-2 rounded text-xs text-zinc-300 overflow-x-auto">
                    {`const fetch = require('node-fetch');

const webhookUrl = '${getWebhookUrl()}';
const payload = {
 passphrase: 'YOUR_WEBHOOK_SECRET',
 ticker: 'BTC-USD',
 action: 'buy',
 quantity: '0.001',
 price: '43250.50'
};

async function sendWebhook() {
 try {
   const response = await fetch(webhookUrl, {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json'
     },
     body: JSON.stringify(payload)
   });
   
   const data = await response.json();
   console.log('Response:', data);
 } catch (error) {
   console.error('Error:', error);
 }
}

sendWebhook();`}
                  </pre>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="tradingview" className="space-y-4">
            <div className="space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-md p-3">
                <div className="flex items-start">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                  <div className="text-sm text-blue-400">
                    <p>
                      TradingView allows you to send webhook alerts when your indicators or strategies trigger. Here's
                      how to set it up.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">TradingView Alert Template</h3>
                <p className="text-sm text-zinc-400">Use this template in your TradingView alert message field:</p>
                <div className="relative">
                  <Textarea
                    value={examplePayloads.tradingview}
                    readOnly
                    className="min-h-[200px] font-mono text-sm bg-zinc-900 border-zinc-800 text-white"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(examplePayloads.tradingview, "tradingview-payload")}
                    className="absolute top-2 right-2"
                  >
                    {copied === "tradingview-payload" ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <Copy className="h-4 w-4 mr-2" />
                    )}
                    Copy
                  </Button>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  TradingView will automatically replace the placeholders like {"{"}
                  {"{"}"ticker"{"}"}
                  {"}"} with actual values.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-medium text-white">Setting Up TradingView Alerts</h3>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-zinc-400">
                  <li>Open TradingView and navigate to your chart</li>
                  <li>Click on the "Alerts" button in the right sidebar</li>
                  <li>Click "Create Alert" and configure your alert conditions</li>
                  <li>In the "Alert actions" section, select "Webhook URL"</li>
                  <li>
                    Paste your webhook URL:{" "}
                    <code className="bg-zinc-800 px-1 py-0.5 rounded text-xs">{getWebhookUrl()}</code>
                  </li>
                  <li>In the "Message" field, paste the TradingView template from above</li>
                  <li>
                    Replace <code className="bg-zinc-800 px-1 py-0.5 rounded text-xs">YOUR_WEBHOOK_SECRET</code> with
                    your actual webhook secret
                  </li>
                  <li>Click "Create" to save your alert</li>
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
        </Tabs>
      </CardContent>
    </Card>
  )
}
