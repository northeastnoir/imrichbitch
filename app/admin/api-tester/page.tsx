"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle2, Copy, ExternalLink } from "lucide-react"

export default function ApiTester() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState("")

  const [apiKeyId, setApiKeyId] = useState("")
  const [privateKey, setPrivateKey] = useState("")
  const [apiSecret, setApiSecret] = useState("")
  const [testEndpoint, setTestEndpoint] = useState("/api/v3/brokerage/accounts")
  const [testMethod, setTestMethod] = useState("GET")
  const [testBody, setTestBody] = useState("")

  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [authType, setAuthType] = useState("jwt")

  // Handle authentication
  const handleAuth = async () => {
    if (password === process.env.NEXT_PUBLIC_ACCESS_PASSWORD) {
      setIsAuthenticated(true)
      setAuthError("")
    } else {
      setAuthError("Invalid password")
    }
  }

  // Handle API test
  const handleTest = async () => {
    try {
      setLoading(true)
      setError(null)
      setResult(null)

      // Prepare request body
      let parsedBody = null
      if (testBody.trim()) {
        try {
          parsedBody = JSON.parse(testBody)
        } catch (e) {
          setError("Invalid JSON in request body")
          setLoading(false)
          return
        }
      }

      // Make the test request
      const response = await fetch("/api/admin/test-api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authType,
          apiKeyId,
          privateKey: authType === "jwt" ? privateKey : undefined,
          apiSecret: authType === "hmac" ? apiSecret : undefined,
          endpoint: testEndpoint,
          method: testMethod,
          body: parsedBody,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to test API")
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Copy result to clipboard
  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-10 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>API Tester Authentication</CardTitle>
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
    <div className="container mx-auto py-10">
      <Card className="bg-gray-100">
        <CardHeader>
          <CardTitle>Coinbase API Tester</CardTitle>
          <CardDescription>Test your Coinbase API credentials without redeploying</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="jwt" onValueChange={(value) => setAuthType(value)}>
            <TabsList className="mb-4">
              <TabsTrigger value="jwt">JWT Authentication</TabsTrigger>
              <TabsTrigger value="hmac">HMAC Authentication</TabsTrigger>
            </TabsList>

            <TabsContent value="jwt" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKeyId">API Key ID</Label>
                <Input
                  id="apiKeyId"
                  placeholder="Your Coinbase API Key ID"
                  value={apiKeyId}
                  onChange={(e) => setApiKeyId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="privateKey">Private Key (PEM format)</Label>
                <Textarea
                  id="privateKey"
                  placeholder="-----BEGIN EC PRIVATE KEY-----..."
                  className="font-mono text-xs h-32"
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                />
              </div>
            </TabsContent>

            <TabsContent value="hmac" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKeyId">API Key</Label>
                <Input
                  id="apiKeyId"
                  placeholder="Your Coinbase API Key"
                  value={apiKeyId}
                  onChange={(e) => setApiKeyId(e.target.value)}
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
              </div>
            </TabsContent>

            <div className="space-y-4 mt-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="testMethod">Request Method</Label>
                  <select
                    id="testMethod"
                    className="w-full p-2 border rounded"
                    value={testMethod}
                    onChange={(e) => setTestMethod(e.target.value)}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="testEndpoint">API Endpoint</Label>
                  <Input
                    id="testEndpoint"
                    placeholder="/api/v3/brokerage/accounts"
                    value={testEndpoint}
                    onChange={(e) => setTestEndpoint(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="testBody">Request Body (JSON, for POST/PUT)</Label>
                <Textarea
                  id="testBody"
                  placeholder="{}"
                  className="font-mono text-xs h-24"
                  value={testBody}
                  onChange={(e) => setTestBody(e.target.value)}
                />
              </div>

              <Button onClick={handleTest} disabled={loading} className="w-full">
                {loading ? "Testing..." : "Test API Connection"}
              </Button>
            </div>
          </Tabs>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Result</h3>
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
              </div>
              <div className="bg-black text-green-400 p-4 rounded overflow-auto max-h-96">
                <pre className="text-xs">{JSON.stringify(result, null, 2)}</pre>
              </div>
              {result.success && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Success</AlertTitle>
                  <AlertDescription className="text-green-700">
                    API connection successful! You can use these credentials in your application.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back
          </Button>
          <a
            href="https://docs.cloud.coinbase.com/exchange/reference/exchangerestapi_getaccounts"
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
