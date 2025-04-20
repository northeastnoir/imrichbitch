import { createClient } from "@supabase/supabase-js"
import { monitoring } from "./monitoring-service"

// Initialize Supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient

  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase credentials not configured")
  }

  supabaseClient = createClient(supabaseUrl, supabaseKey)
  return supabaseClient
}

export async function logToSupabase({
  ticker,
  action,
  price,
  quantity,
  tradeResult,
}: {
  ticker: string
  action: string
  price: string | number
  quantity: string | number
  tradeResult: any
}) {
  try {
    const supabase = getSupabaseClient()

    // Prepare the log entry
    const logEntry = {
      ticker,
      action: typeof action === "string" ? action.toUpperCase() : action,
      price: price?.toString() || "MARKET",
      quantity: quantity?.toString(),
      trade_id: tradeResult?.orderId || null,
      status: tradeResult?.status || "UNKNOWN",
      error_message: tradeResult?.error || null,
      raw_response: JSON.stringify(tradeResult),
      created_at: new Date().toISOString(),
    }

    // Insert the log entry into the trade_logs table
    const { data, error } = await supabase.from("trade_logs").insert(logEntry)

    if (error) {
      monitoring.error("Failed to log trade to Supabase", { error, logEntry })
      console.error("Supabase log error:", error)
      return { success: false, error }
    }

    monitoring.info("Trade logged to Supabase", { tradeId: tradeResult?.orderId })
    return { success: true, data }
  } catch (error) {
    monitoring.error("Exception logging trade to Supabase", {
      error: error instanceof Error ? error.message : "Unknown error",
    })
    console.error("Exception in Supabase logger:", error)
    return { success: false, error }
  }
}

export async function getRecentTradeLogs(limit = 20) {
  try {
    const supabase = getSupabaseClient()

    const { data, error } = await supabase
      .from("trade_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      console.error("Error fetching trade logs:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (error) {
    console.error("Exception fetching trade logs:", error)
    return { success: false, error }
  }
}
