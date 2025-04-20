"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle, RefreshCw, ExternalLink } from "lucide-react"

export function CredentialChecker() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [credentialStatus, setCredentialStatus] = useState<any>(null)
  const [connectionTest, setConnectionTest] = useState<any>(null)
  const [recommendations, setRecommendations] = useState<any[]>([])

  const checkCredentials = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/check-credentials")
      const data = await response.json()

      if (!response.ok) {
        setError(data.message || "Failed to check credentials")
      } else {
        setCredentialStatus(data.credentialStatus)
        setConnectionTest(data.connectionTest)
        setRecommendations(data.recommendations || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkCredentials()
  }, [])

  return (
    <Card className="bg-black border-zinc-900 shadow-xl tech-glow">
      <CardHeader className="border-b border-zinc-900 pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white">API Credential Status</CardTitle>
          <CardDescription>Check your Coinbase API credentials</CardDescription>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white"
          onClick={checkCredentials}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
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
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
                <h3 className="text-xs font-medium text-zinc-400 mb-1">API Key</h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">
                    {credentialStatus.apiKey.configured ? credentialStatus.apiKey.value : "Not Configured"}
                  </p>
                  {credentialStatus.apiKey.configured ? (
                    <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Configured</Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-500 border-red-500/50">Missing</Badge>
                  )}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
                <h3 className="text-xs font-medium text-zinc-400 mb-1">API Secret</h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">
                    {credentialStatus.apiSecret.configured ? credentialStatus.apiSecret.value : "Not Configured"}
                  </p>
                  {credentialStatus.apiSecret.configured ? (
                    <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Configured</Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-500 border-red-500/50">Missing</Badge>
                  )}
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
                <h3 className="text-xs font-medium text-zinc-400 mb-1">Private Key</h3>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-white">
                    {credentialStatus.privateKey.configured
                      ? `Format: ${credentialStatus.privateKey.format}`
                      : "Not Configured"}
                  </p>
                  {credentialStatus.privateKey.configured && credentialStatus.privateKey.format === "PKCS#8" ? (
                    <Badge className="bg-green-500/20 text-green-500 border-green-500/50">Valid</Badge>
                  ) : credentialStatus.privateKey.configured ? (
                    <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/50">Invalid Format</Badge>
                  ) : (
                    <Badge className="bg-zinc-500/20 text-zinc-500 border-zinc-500/50">Not Used</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
              <h3 className="text-xs font-medium text-zinc-400 mb-1">Authentication Method</h3>
              <p className="text-sm font-medium text-white">{credentialStatus.recommendedAuth || "None Available"}</p>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-md p-3">
              <h3 className="text-xs font-medium text-zinc-400 mb-1">Connection Test</h3>
              <div className="flex items-center">
                {connectionTest.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                )}
                <span className={connectionTest.success ? "text-green-400" : "text-red-400"}>
                  {connectionTest.message}
                </span>
              </div>
              {connectionTest.details && (
                <p className="text-xs text-zinc-500 mt-1">
                  {typeof connectionTest.details === "string"
                    ? connectionTest.details
                    : JSON.stringify(connectionTest.details)}
                </p>
              )}
            </div>

            {recommendations.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-white">Recommendations</h3>
                {recommendations.map((rec, index) => (
                  <Alert
                    key={index}
                    className={
                      rec.priority === "high"
                        ? "bg-red-500/10 border-red-500/20"
                        : rec.priority === "medium"
                          ? "bg-yellow-500/10 border-yellow-500/20"
                          : "bg-blue-500/10 border-blue-500/20"
                    }
                  >
                    <AlertCircle
                      className={`h-4 w-4 ${
                        rec.priority === "high"
                          ? "text-red-500"
                          : rec.priority === "medium"
                            ? "text-yellow-500"
                            : "text-blue-500"
                      }`}
                    />
                    <AlertTitle
                      className={
                        rec.priority === "high"
                          ? "text-red-500"
                          : rec.priority === "medium"
                            ? "text-yellow-500"
                            : "text-blue-500"
                      }
                    >
                      {rec.message}
                    </AlertTitle>
                    <AlertDescription
                      className={
                        rec.priority === "high"
                          ? "text-red-400"
                          : rec.priority === "medium"
                            ? "text-yellow-400"
                            : "text-blue-400"
                      }
                    >
                      {rec.details}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <Button variant="outline" size="sm" className="text-xs">
                <ExternalLink className="h-3 w-3 mr-1" />
                <a href="https://docs.cloud.coinbase.com/exchange/docs/auth" target="_blank" rel="noopener noreferrer">
                  Coinbase Auth Docs
                </a>
              </Button>

              <Button
                onClick={checkCredentials}
                disabled={loading}
                size="sm"
                className="bg-[#b76e9b] hover:bg-[#a25d8a] text-white"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-3 w-3 mr-1" /> Recheck
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
