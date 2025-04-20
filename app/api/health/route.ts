import { NextResponse } from "next/server"
import { testConnection } from "@/lib/coinbase-api"
import { createClient } from "@supabase/supabase-js"
import { monitoring } from "@/lib/monitoring-service"

export async function GET() {
  const healthStatus = {
    success: true,
    timestamp: new Date().toISOString(),
    services: {
      coinbase: {
        status: "unknown",
        message: "",
        details: null,
      },
      supabase: {
        status: "unknown",
        message: "",
        details: null,
      },
      webhook: {
        status: "unknown",
        message: "",
        details: null,
      },
      system: {
        status: "healthy",
        uptime: process.uptime(),
        memory: process.memoryUsage(),
      },
    },
    environment: {
      coinbaseApiKey: !!process.env.COINBASE_API_KEY,
      coinbaseApiSecret: !!process.env.COINBASE_API_SECRET,
      coinbasePrivateKey: !!process.env.COINBASE_PRIVATE_KEY,
      webhookSecret: !!process.env.WEBHOOK_SECRET,
      accessPassword: !!process.env.NEXT_PUBLIC_ACCESS_PASSWORD,
      supabaseUrl: !!process.env.SUPABASE_URL,
      supabaseKey: !!process.env.SUPABASE_ANON_KEY || !!process.env.SUPABASE_KEY,
      discordWebhook: !!process.env.DISCORD_WEBHOOK_URL,
    },
  }

  // Log health check
  monitoring.info("Health check initiated")

  // Check Coinbase API
  try {
    const coinbaseResult = await testConnection()
    healthStatus.services.coinbase = {
      status: coinbaseResult.success ? "healthy" : "error",
      message: coinbaseResult.message,
      details: coinbaseResult.productsCount ? { productsCount: coinbaseResult.productsCount } : null,
    }
  } catch (error) {
    healthStatus.services.coinbase = {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error testing Coinbase connection",
      details: null,
    }
    monitoring.error("Coinbase health check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }

  // Check Supabase
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data, error } = await supabase.from("trade_logs").select("count").limit(1)

      healthStatus.services.supabase = {
        status: error ? "error" : "healthy",
        message: error ? error.message : "Successfully connected to Supabase",
        details: data ? { data } : null,
      }
    } else {
      healthStatus.services.supabase = {
        status: "warning",
        message: "Supabase credentials not configured",
        details: null,
      }
    }
  } catch (error) {
    healthStatus.services.supabase = {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error testing Supabase connection",
      details: null,
    }
    monitoring.error("Supabase health check failed", {
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }

  // Check webhook configuration
  healthStatus.services.webhook = {
    status: process.env.WEBHOOK_SECRET ? "healthy" : "warning",
    message: process.env.WEBHOOK_SECRET
      ? "Webhook secret is configured"
      : "Webhook secret is not configured, webhook authentication will be disabled",
    details: null,
  }

  // Set overall status
  healthStatus.success =
    healthStatus.services.coinbase.status !== "error" &&
    (healthStatus.services.supabase.status !== "error" || !process.env.SUPABASE_URL) &&
    healthStatus.services.webhook.status !== "error"

  // Log health check result
  if (healthStatus.success) {
    monitoring.info("Health check completed successfully")
  } else {
    monitoring.warn("Health check completed with issues", healthStatus)
  }

  return NextResponse.json(healthStatus)
}
