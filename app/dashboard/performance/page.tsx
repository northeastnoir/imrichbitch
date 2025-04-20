"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { PerformanceMetrics } from "@/components/performance-metrics"
import { BalanceChart } from "@/components/balance-chart"
import { TradePerformanceHistory } from "@/components/trade-performance-history"
import { NotificationCenter } from "@/components/notification-center"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Share2 } from "lucide-react"

export default function PerformanceDashboardPage() {
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

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      <header className="mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 text-zinc-400 hover:text-white"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tighter">
              <span className="text-white">Trading Performance</span>
              <span className="text-[#b76e9b]"> Dashboard</span>
            </h1>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white">
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
            <Button variant="outline" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white">
              <Share2 className="h-4 w-4 mr-2" />
              Share Report
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 mb-4">
        <BalanceChart />
      </div>

      <div className="grid grid-cols-1 gap-4 mb-4">
        <PerformanceMetrics />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="md:col-span-2">
          <TradePerformanceHistory />
        </div>
        <div>
          <NotificationCenter />
        </div>
      </div>
    </div>
  )
}
