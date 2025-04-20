"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SystemStatus } from "@/components/system-status"
import { CoinbaseStatus } from "@/components/coinbase-status"
import { TradingViewWidget } from "@/components/trading-view-widget"
import { WebhookTester } from "@/components/webhook-tester"
import { PositionSizer } from "@/components/position-sizer"
import { MarketOverview } from "@/components/market-overview"
import { RealTimeMarketData } from "@/components/real-time-market-data"
import { RealTimeOrderUpdates } from "@/components/real-time-order-updates"
import { TradingInterface } from "@/components/trading-interface"
import { SystemMonitor } from "@/components/system-monitor"
import { Wrench, KeyRound, History, FileText, ArrowRight, LineChart } from "lucide-react"
import { LiveTradeScreener } from "@/components/live-trade-screener"
import { AuthSetupGuide } from "@/components/auth-setup-guide"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const [systemStatus, setSystemStatus] = useState<"online" | "offline" | "standby">("standby")
  const router = useRouter()

  // Check authentication
  useEffect(() => {
    try {
      const isAuthenticated = localStorage.getItem("super777-auth") === "true"
      if (!isAuthenticated) {
        router.push("/")
      }
    } catch (error) {
      console.error("Error checking authentication:", error)
      router.push("/")
    }
  }, [router])

  // Handle Coinbase status change
  const handleCoinbaseStatusChange = (status: "online" | "offline" | "standby") => {
    setSystemStatus(status)
  }

  // Handle potential API errors
  useEffect(() => {
    const handleApiErrors = async () => {
      try {
        // Test the API connection
        const response = await fetch("/api/health")
        const data = await response.json()

        // If Coinbase API is not working, show standby status
        if (data.services?.coinbase?.status === "error") {
          setSystemStatus("offline")
        }
      } catch (error) {
        console.error("Error checking API health:", error)
        // Don't change system status on fetch error
      }
    }

    handleApiErrors()
  }, [])

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      <div className="mb-6 p-4 bg-[#b76e9b]/10 border border-[#b76e9b]/20 rounded-lg">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-medium text-white">Ready to deploy?</h2>
            <p className="text-sm text-zinc-400">Follow our step-by-step guide to get your webhook integration live</p>
          </div>
          <Button
            onClick={() => router.push("/dashboard/deployment")}
            className="bg-[#b76e9b] hover:bg-[#a25d8a] text-white"
          >
            Deployment Guide
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
      <header className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tighter italic">
            <span className="text-white">SUPER</span>
            <span className="text-[#b76e9b]">777</span>
            <span className="text-white ml-2 text-sm font-normal tracking-normal">Trading Dashboard</span>
          </h1>
          <div className="flex space-x-2">
            <a
              href="/admin/credentials"
              className="flex items-center text-zinc-400 hover:text-white text-sm bg-zinc-900/50 px-3 py-1 rounded-md border border-zinc-800 mr-2"
            >
              <KeyRound className="h-4 w-4 mr-1" />
              API Keys
            </a>
            <a
              href="/dashboard/tools"
              className="flex items-center text-zinc-400 hover:text-white text-sm bg-zinc-900/50 px-3 py-1 rounded-md border border-zinc-800"
            >
              <Wrench className="h-4 w-4 mr-1" />
              Tools
            </a>
            <a
              href="/dashboard/history"
              className="flex items-center text-zinc-400 hover:text-white text-sm bg-zinc-900/50 px-3 py-1 rounded-md border border-zinc-800"
            >
              <History className="h-4 w-4 mr-1" />
              History
            </a>
            <a
              href="/dashboard/performance"
              className="flex items-center text-zinc-400 hover:text-white text-sm bg-zinc-900/50 px-3 py-1 rounded-md border border-zinc-800"
            >
              <LineChart className="h-4 w-4 mr-1" />
              Performance
            </a>
            <a
              href="/dashboard/documentation"
              className="flex items-center text-zinc-400 hover:text-white text-sm bg-zinc-900/50 px-3 py-1 rounded-md border border-zinc-800"
            >
              <FileText className="h-4 w-4 mr-1" />
              Docs
            </a>
            <button
              onClick={() => {
                try {
                  localStorage.removeItem("super777-auth")
                } catch (error) {
                  console.error("Error removing auth:", error)
                }
                router.push("/")
              }}
              className="text-zinc-500 hover:text-white text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <SystemStatus status={systemStatus} />
        <CoinbaseStatus onStatusChange={handleCoinbaseStatusChange} />
        <LiveTradeScreener />
      </div>

      {systemStatus === "offline" && (
        <div className="mb-4">
          <AuthSetupGuide />
        </div>
      )}

      <Tabs defaultValue="chart" className="w-full">
        <TabsList className="grid grid-cols-5 mb-4 bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="market">Market</TabsTrigger>
          <TabsTrigger value="trade">Trade</TabsTrigger>
          <TabsTrigger value="webhook">Webhook</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>
        <TabsContent value="chart" className="border border-zinc-900 rounded-md p-0 overflow-hidden">
          <div className="grid grid-cols-1 gap-4">
            <div className="h-[600px]">
              <TradingViewWidget />
            </div>
            <RealTimeOrderUpdates />
          </div>
        </TabsContent>
        <TabsContent value="market">
          <div className="grid grid-cols-1 gap-4">
            <RealTimeMarketData />
            <MarketOverview />
          </div>
        </TabsContent>
        <TabsContent value="trade">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TradingInterface />
            <RealTimeOrderUpdates />
          </div>
        </TabsContent>
        <TabsContent value="webhook">
          <WebhookTester />
        </TabsContent>
        <TabsContent value="tools">
          <PositionSizer />
        </TabsContent>
      </Tabs>

      <div className="mt-4">
        <SystemMonitor />
      </div>
    </div>
  )
}
