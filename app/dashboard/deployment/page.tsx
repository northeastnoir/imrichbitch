"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, ExternalLink, Check, Copy, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

export default function DeploymentGuidePage() {
  const router = useRouter()
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      <header className="mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
              className="mr-2 text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tighter italic">
              <span className="text-white">SUPER</span>
              <span className="text-[#b76e9b]">777</span>
              <span className="text-white ml-2 text-sm font-normal tracking-normal">Deployment Guide</span>
            </h1>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto">
        <Card className="bg-black border-zinc-900 mb-6">
          <CardHeader>
            <CardTitle>Deployment Checklist</CardTitle>
            <CardDescription>Follow these steps to deploy your TradingView webhook integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center">
                <span className="flex h-6 w-6 rounded-full bg-green-500/20 text-green-500 mr-2 items-center justify-center text-sm">
                  1
                </span>
                Set up Vercel account
              </h3>
              <p className="text-zinc-400 ml-8">
                If you haven't already, create a Vercel account at{" "}
                <a
                  href="https://vercel.com/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#b76e9b] hover:underline"
                >
                  vercel.com/signup
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center">
                <span className="flex h-6 w-6 rounded-full bg-green-500/20 text-green-500 mr-2 items-center justify-center text-sm">
                  2
                </span>
                Deploy to Vercel
              </h3>
              <p className="text-zinc-400 ml-8">
                Click the "Deploy" button in the top right corner of this page to deploy to Vercel
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center">
                <span className="flex h-6 w-6 rounded-full bg-green-500/20 text-green-500 mr-2 items-center justify-center text-sm">
                  3
                </span>
                Configure environment variables
              </h3>
              <div className="ml-8 bg-zinc-900 rounded-md p-3 border border-zinc-800">
                <p className="text-zinc-400 mb-2">
                  Add the following environment variables in your Vercel project settings:
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-zinc-800/50 p-2 rounded">
                    <code className="text-green-400">COINBASE_API_KEY</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => copyToClipboard("COINBASE_API_KEY", "coinbase_key")}
                    >
                      {copiedSection === "coinbase_key" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-800/50 p-2 rounded">
                    <code className="text-green-400">COINBASE_API_SECRET</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => copyToClipboard("COINBASE_API_SECRET", "coinbase_secret")}
                    >
                      {copiedSection === "coinbase_secret" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-800/50 p-2 rounded">
                    <code className="text-green-400">WEBHOOK_SECRET</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => copyToClipboard("WEBHOOK_SECRET", "webhook_secret")}
                    >
                      {copiedSection === "webhook_secret" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-800/50 p-2 rounded">
                    <code className="text-green-400">NEXT_PUBLIC_ACCESS_PASSWORD</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => copyToClipboard("NEXT_PUBLIC_ACCESS_PASSWORD", "access_password")}
                    >
                      {copiedSection === "access_password" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <div className="flex justify-between items-center bg-zinc-800/50 p-2 rounded">
                    <code className="text-green-400">DISCORD_WEBHOOK_URL</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => copyToClipboard("DISCORD_WEBHOOK_URL", "discord_webhook")}
                    >
                      {copiedSection === "discord_webhook" ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center">
                <span className="flex h-6 w-6 rounded-full bg-green-500/20 text-green-500 mr-2 items-center justify-center text-sm">
                  4
                </span>
                Set up Supabase (optional but recommended)
              </h3>
              <div className="ml-8 space-y-2">
                <p className="text-zinc-400">
                  Create a Supabase project at{" "}
                  <a
                    href="https://supabase.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#b76e9b] hover:underline"
                  >
                    supabase.com
                  </a>
                </p>
                <p className="text-zinc-400">Add these additional environment variables to Vercel:</p>
                <div className="bg-zinc-900 rounded-md p-3 border border-zinc-800">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-zinc-800/50 p-2 rounded">
                      <code className="text-green-400">SUPABASE_URL</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => copyToClipboard("SUPABASE_URL", "supabase_url")}
                      >
                        {copiedSection === "supabase_url" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                    <div className="flex justify-between items-center bg-zinc-800/50 p-2 rounded">
                      <code className="text-green-400">SUPABASE_ANON_KEY</code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => copyToClipboard("SUPABASE_ANON_KEY", "supabase_anon_key")}
                      >
                        {copiedSection === "supabase_anon_key" ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                <p className="text-zinc-400">After deployment, initialize your Supabase tables by visiting:</p>
                <div className="bg-zinc-900 rounded-md p-3 border border-zinc-800">
                  <code className="text-green-400">https://your-domain.vercel.app/api/init-supabase</code>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center">
                <span className="flex h-6 w-6 rounded-full bg-green-500/20 text-green-500 mr-2 items-center justify-center text-sm">
                  5
                </span>
                Configure TradingView alerts
              </h3>
              <div className="ml-8 space-y-2">
                <p className="text-zinc-400">In TradingView, create an alert with webhook URL:</p>
                <div className="bg-zinc-900 rounded-md p-3 border border-zinc-800">
                  <div className="flex justify-between items-center">
                    <code className="text-green-400">https://your-domain.vercel.app/api/tradingview-webhook</code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() =>
                        copyToClipboard("https://your-domain.vercel.app/api/tradingview-webhook", "webhook_url")
                      }
                    >
                      {copiedSection === "webhook_url" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
                <p className="text-zinc-400">Use this JSON format for your TradingView alert message:</p>
                <div className="bg-zinc-900 rounded-md p-3 border border-zinc-800">
                  <div className="flex justify-between items-center">
                    <pre className="text-green-400 text-xs overflow-x-auto">
                      {`{
  "ticker": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "price": "{{strategy.order.price}}",
  "quantity": "{{strategy.position_size}}"
}`}
                    </pre>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs ml-2"
                      onClick={() =>
                        copyToClipboard(
                          `{
  "ticker": "{{ticker}}",
  "action": "{{strategy.order.action}}",
  "price": "{{strategy.order.price}}",
  "quantity": "{{strategy.position_size}}"
}`,
                          "alert_json",
                        )
                      }
                    >
                      {copiedSection === "alert_json" ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center">
                <span className="flex h-6 w-6 rounded-full bg-green-500/20 text-green-500 mr-2 items-center justify-center text-sm">
                  6
                </span>
                Test your webhook
              </h3>
              <p className="text-zinc-400 ml-8">
                Use the webhook testing tool at <code className="text-green-400">/dashboard/webhook-test</code> to
                verify your setup
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium flex items-center">
                <span className="flex h-6 w-6 rounded-full bg-green-500/20 text-green-500 mr-2 items-center justify-center text-sm">
                  7
                </span>
                Monitor your system
              </h3>
              <p className="text-zinc-400 ml-8">Use the dashboard to monitor your trades and system status</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black border-zinc-900 mb-6">
          <CardHeader>
            <CardTitle>Security Recommendations</CardTitle>
            <CardDescription>Important security considerations for your deployment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-400">Use a strong webhook secret</h4>
                <p className="text-zinc-400 text-sm">
                  Generate a random string for your WEBHOOK_SECRET to prevent unauthorized access to your webhook
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-400">Restrict Coinbase API permissions</h4>
                <p className="text-zinc-400 text-sm">
                  When creating your Coinbase API key, only grant the minimum permissions needed for trading
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-400">Use a strong access password</h4>
                <p className="text-zinc-400 text-sm">
                  Set a strong NEXT_PUBLIC_ACCESS_PASSWORD to protect your dashboard
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
              <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-yellow-400">Start with small trade sizes</h4>
                <p className="text-zinc-400 text-sm">
                  Begin with small trade sizes to test your system before scaling up
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
            className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>

          <Button
            onClick={() => router.push("/dashboard/webhook-test")}
            className="bg-[#b76e9b] hover:bg-[#a25d8a] text-white"
          >
            Test Webhook
            <ExternalLink className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )
}
