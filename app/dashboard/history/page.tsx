"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WebhookHistory } from "@/components/webhook-history"
import { SystemMonitor } from "@/components/system-monitor"
import { NotificationCenter } from "@/components/notification-center"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

export default function HistoryPage() {
  const router = useRouter()

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
              <span className="text-white ml-2 text-sm font-normal tracking-normal">History & Logs</span>
            </h1>
          </div>
        </div>
      </header>

      <Tabs defaultValue="webhooks" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4 bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="webhooks">Webhook History</TabsTrigger>
          <TabsTrigger value="system">System Logs</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks">
          <WebhookHistory />
        </TabsContent>

        <TabsContent value="system">
          <SystemMonitor />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationCenter />
        </TabsContent>
      </Tabs>
    </div>
  )
}
