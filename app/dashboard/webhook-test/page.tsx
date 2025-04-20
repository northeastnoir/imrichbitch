"use client"

import { WebhookTestTool } from "@/components/webhook-test-tool"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { WebhookDocumentation } from "@/components/webhook-documentation"

export default function WebhookTestPage() {
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
              <span className="text-white ml-2 text-sm font-normal tracking-normal">Webhook Testing</span>
            </h1>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WebhookTestTool />
        <WebhookDocumentation />
      </div>
    </div>
  )
}
