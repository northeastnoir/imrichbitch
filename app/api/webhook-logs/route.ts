import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Check if Supabase credentials are configured
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.log("Supabase credentials not configured, returning mock data")
      return NextResponse.json({
        success: true,
        logs: getMockLogs(),
        isMockData: true,
        message: "Using mock data - Supabase credentials not configured",
      })
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch webhook logs from Supabase
    const { data, error } = await supabase
      .from("trade_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching webhook logs from Supabase:", error)
      return NextResponse.json({
        success: false,
        message: "Error fetching webhook logs",
        error: error.message,
      })
    }

    return NextResponse.json({
      success: true,
      logs: data,
    })
  } catch (error) {
    console.error("Error in webhook logs API:", error)
    return NextResponse.json({
      success: false,
      message: "Error fetching webhook logs",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

// Mock data for development and fallback
function getMockLogs() {
  return [
    {
      id: "1",
      ticker: "BTC-USD",
      action: "BUY",
      quantity: "0.01",
      price: "43250.50",
      status: "completed",
      trade_id: "ord-123456789abcdef",
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    },
    {
      id: "2",
      ticker: "ETH-USD",
      action: "SELL",
      quantity: "0.5",
      price: "2310.75",
      status: "completed",
      trade_id: "ord-987654321abcdef",
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    },
    {
      id: "3",
      ticker: "SOL-USD",
      action: "BUY",
      quantity: "5",
      status: "error",
      error_message: "Insufficient funds to execute order",
      created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1 hour ago
    },
    {
      id: "4",
      ticker: "XRP-USD",
      action: "SELL",
      quantity: "100",
      price: "0.59",
      status: "pending",
      created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString(), // 2 minutes ago
    },
    {
      id: "5",
      ticker: "BTC-USD",
      action: "BUY",
      quantity: "0.005",
      price: "43150.25",
      status: "completed",
      trade_id: "ord-abcdef123456789",
      created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
    },
  ]
}
