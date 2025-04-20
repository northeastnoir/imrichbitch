"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle, Copy, ExternalLink, RefreshCw } from "lucide-react"

export function AuthSetupGuide() {
  const [loading, setLoading] = useState(false)
  const [testResults, setTestResults] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testAuthMethods = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/test-auth-methods")
      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to test authentication methods")
      } else {
        setTestResults(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    testAuthMethods()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Card className="bg-black border-zinc-900 shadow-xl tech-glow">
      <CardHeader className="border-b border-zinc-900 pb-3">
        <CardTitle className="text-white">Authentication Setup Guide</CardTitle>
        <CardDescription>Configure Coinbase API authentication</CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : testResults ? (
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-md p-4">
              <h3 className="text-lg font-medium text-white mb-2">Authentication Status</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
                  <h4 className="text-sm font-medium text-zinc-400 mb-1">JWT Authentication</h4>
                  <div className="flex items-center">
                    {testResults.results.jwt.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className={testResults.results.jwt.success ? "text-green-400" : "text-red-400"}>
                      {testResults.results.jwt.message}
                    </span>
                  </div>
                  {testResults.results.jwt.error && (
                    <p className="text-xs text-red-400 mt-1">{testResults.results.jwt.error}</p>
                  )}
                </div>

                <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
                  <h4 className="text-sm font-medium text-zinc-400 mb-1">HMAC Authentication</h4>
                  <div className="flex items-center">
                    {testResults.results.hmac.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span className={testResults.results.hmac.success ? "text-green-400" : "text-red-400"}>
                      {testResults.results.hmac.message}
                    </span>
                  </div>
                  {testResults.results.hmac.error && (
                    <p className="text-xs text-red-400 mt-1">{testResults.results.hmac.error}</p>
                  )}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
                <h4 className="text-sm font-medium text-zinc-400 mb-1">Recommended Authentication Method</h4>
                <p className="text-white">
                  {testResults.recommendedMethod === "JWT"
                    ? "JWT Authentication (preferred for better security)"
                    : testResults.recommendedMethod === "HMAC"
                      ? "HMAC Authentication (fallback method)"
                      : "No working authentication method found"}
                </p>
              </div>
            </div>

            <Tabs defaultValue="jwt">
              <TabsList className="grid grid-cols-2 mb-4 bg-zinc-900 border border-zinc-800">
                <TabsTrigger value="jwt">JWT Authentication</TabsTrigger>
                <TabsTrigger value="hmac">HMAC Authentication</TabsTrigger>
              </TabsList>

              <TabsContent value="jwt" className="space-y-4">
                <Alert className="bg-blue-500/10 border-blue-500/20">
                  <AlertCircle className="h-4 w-4 text-blue-500" />
                  <AlertTitle className="text-blue-500">JWT Authentication Setup</AlertTitle>
                  <AlertDescription className="text-blue-400">
                    JWT authentication requires a private key in PKCS#8 format. Follow these steps to set up JWT
                    authentication.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-white">1. Generate a key pair</h3>
                  <div className="bg-zinc-900 p-3 rounded-md font-mono text-xs text-zinc-400">
                    <p># Generate a private key in PKCS#8 format</p>
                    <p>openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out private.pem</p>
                    <p># Extract the public key</p>
                    <p>openssl ec -in private.pem -pubout -out public.pem</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() =>
                        copyToClipboard(
                          "openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out private.pem\nopenssl ec -in private.pem -pubout -out public.pem",
                        )
                      }
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-white">2. Add to Coinbase API settings</h3>
                  <p className="text-sm text-zinc-400">
                    Go to your Coinbase Advanced Trade API settings and create a new API key with the public key.
                  </p>
                  <Button variant="outline" size="sm" className="mt-1">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    <a href="https://www.coinbase.com/settings/api" target="_blank" rel="noopener noreferrer">
                      Coinbase API Settings
                    </a>
                  </Button>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-white">3. Add to environment variables</h3>
                  <p className="text-sm text-zinc-400">
                    Add your API key and private key to your Vercel environment variables.
                  </p>
                  <div className="bg-zinc-900 p-3 rounded-md font-mono text-xs text-zinc-400">
                    <p>COINBASE_API_KEY=your_api_key</p>
                    <p>COINBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----</p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="hmac" className="space-y-4">
                <Alert className="bg-yellow-500/10 border-yellow-500/20">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertTitle className="text-yellow-500">HMAC Authentication Setup</AlertTitle>
                  <AlertDescription className="text-yellow-400">
                    HMAC authentication is simpler but less secure. Use this if you're having issues with JWT.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-white">1. Create API key in Coinbase</h3>
                  <p className="text-sm text-zinc-400">
                    Go to your Coinbase Advanced Trade API settings and create a new API key with HMAC authentication.
                  </p>
                  <Button variant="outline" size="sm" className="mt-1">
                    <ExternalLink className="h-3 w-3 mr-1" />
                    <a href="https://www.coinbase.com/settings/api" target="_blank" rel="noopener noreferrer">
                      Coinbase API Settings
                    </a>
                  </Button>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-white">2. Add to environment variables</h3>
                  <p className="text-sm text-zinc-400">
                    Add your API key and secret to your Vercel environment variables.
                  </p>
                  <div className="bg-zinc-900 p-3 rounded-md font-mono text-xs text-zinc-400">
                    <p>COINBASE_API_KEY=your_api_key</p>
                    <p>COINBASE_API_SECRET=your_api_secret</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end">
              <Button
                onClick={testAuthMethods}
                disabled={loading}
                className="bg-[#b76e9b] hover:bg-[#a25d8a] text-white"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Testing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" /> Test Authentication
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
