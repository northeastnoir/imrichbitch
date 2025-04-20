"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TestTradeInterface } from "@/components/test-trade-interface"
import { TradingViewWebhookGuide } from "@/components/tradingview-webhook-guide"
import { NotificationCenter } from "@/components/notification-center"
import { WebhookTester } from "@/components/webhook-tester"
import { SystemMonitor } from "@/components/system-monitor"

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      <header className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-tighter italic">
            <span className="text-white">SUPER</span>
            <span className="text-[#b76e9b]">777</span>
            <span className="text-white ml-2 text-sm font-normal tracking-normal">Trading Tools</span>
          </h1>
          <a href="/dashboard" className="text-zinc-500 hover:text-white text-sm">
            Back to Dashboard
          </a>
        </div>
      </header>

      <Tabs defaultValue="test" className="w-full">
        <TabsList className="grid grid-cols-4 mb-4 bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="test">Test Trades</TabsTrigger>
          <TabsTrigger value="webhook">Webhook Setup</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="monitor">System Monitor</TabsTrigger>
        </TabsList>

        <TabsContent value="test">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TestTradeInterface />
            <WebhookTester />
          </div>
        </TabsContent>

        <TabsContent value="webhook">
          <TradingViewWebhookGuide />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationCenter />
        </TabsContent>

        <TabsContent value="monitor">
          <SystemMonitor />
        </TabsContent>
      </Tabs>
    </div>
  )
}
