"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Copy, ExternalLink, KeyRound, Shield } from "lucide-react"

export default function CredentialsManager() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState("")

  const [apiKey, setApiKey] = useState("")
  const [apiSecret, setApiSecret] = useState("")
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Handle authentication
  const handleAuth = async () => {
    if (password === process.env.NEXT_PUBLIC_ACCESS_PASSWORD) {
      setIsAuthenticated(true)
      setAuthError("")
    } else {
      setAuthError("Invalid password")
    }
  }

  // Test API credentials
  const testCredentials = async () => {
    if (!apiKey || !apiSecret) {
      setError("Please enter both API Key and API Secret")
      return
    }

    try {
      setLoading(true)
      setError(null)
      setTestResult(null)

      const response = await fetch("/api/test-credentials", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          apiKey,
          apiSecret,
        }),
      })

      const data = await response.json()
      setTestResult(data)

      if (!data.success) {
        setError(data.message || "Failed to verify credentials")
      }
    } catch (err) {
      console.error("Error testing credentials:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  // Copy instructions for setting environment variables
  const copyInstructions = () => {
    const instructions = `
# Add these to your Vercel environment variables:
COINBASE_API_KEY=${apiKey}
COINBASE_API_SECRET=${apiSecret}
    `.trim()

    navigator.clipboard.writeText(instructions)
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-10 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>API Credentials Manager</CardTitle>
            <CardDescription>Enter your access password to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Access Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAuth()}
                />
              </div>
              {authError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{authError}</AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleAuth} className="w-full">
              Authenticate
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[#b76e9b]" />
            <CardTitle>Coinbase API Credentials</CardTitle>
          </div>
          <CardDescription>Test and manage your Coinbase API credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Shield className="h-4 w-4" />
            <AlertTitle>Security Notice</AlertTitle>
            <AlertDescription>
              Your API credentials are sensitive. They will only be used for testing and will not be stored on our
              servers. For production use, add them to your Vercel environment variables.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                placeholder="Your Coinbase API Key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiSecret">API Secret</Label>
              <Input
                id="apiSecret"
                type="password"
                placeholder="Your Coinbase API Secret"
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                This is kept in memory only and never stored on our servers.
              </p>
            </div>

            <Button
              onClick={testCredentials}
              disabled={loading || !apiKey || !apiSecret}
              className="w-full bg-[#b76e9b] hover:bg-[#a25d8a]"
            >
              {loading ? "Testing..." : "Test Credentials"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {testResult && testResult.success && (
            <div className="mt-4 space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Success!</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your Coinbase API credentials are valid. You can now add them to your Vercel environment variables.
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-4 rounded-md border">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-medium">Next Steps</h3>
                  <Button variant="outline" size="sm" onClick={copyInstructions}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
                  <li>Go to your Vercel project settings</li>
                  <li>Navigate to the Environment Variables section</li>
                  <li>
                    Add <code>COINBASE_API_KEY</code> with your API key
                  </li>
                  <li>
                    Add <code>COINBASE_API_SECRET</code> with your API secret
                  </li>
                  <li>Deploy your project again to apply the changes</li>
                </ol>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
          <a
            href="https://docs.cloud.coinbase.com/exchange/docs/authorization-and-authentication"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="link" className="gap-1">
              Coinbase API Docs
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </CardFooter>
      </Card>
    </div>
  )
}
