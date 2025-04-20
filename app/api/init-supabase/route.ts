import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    // Check if Supabase credentials are configured
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({
        success: false,
        message: "Supabase credentials not configured",
      })
    }

    // Initialize Supabase client with service role key for admin operations
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Create trade_logs table if it doesn't exist
    const { error: tableError } = await supabase.rpc("create_trade_logs_if_not_exists")

    if (tableError) {
      // If the RPC function doesn't exist, create the table directly
      const { error: createError } = await supabase.query(`
        CREATE TABLE IF NOT EXISTS trade_logs (
          id SERIAL PRIMARY KEY,
          ticker TEXT NOT NULL,
          action TEXT NOT NULL,
          price TEXT NOT NULL,
          quantity TEXT NOT NULL,
          trade_id TEXT,
          status TEXT,
          error_message TEXT,
          raw_response TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS trade_logs_created_at_idx ON trade_logs (created_at DESC);
      `)

      if (createError) {
        console.error("Error creating trade_logs table:", createError)
        return NextResponse.json({
          success: false,
          message: "Failed to create trade_logs table",
          error: createError,
        })
      }
    }

    // Create webhook_logs table if it doesn't exist
    const { error: webhookTableError } = await supabase.query(`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id SERIAL PRIMARY KEY,
        request_body TEXT NOT NULL,
        request_headers TEXT,
        response_body TEXT,
        response_status INTEGER,
        ip_address TEXT,
        processing_time_ms INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS webhook_logs_created_at_idx ON webhook_logs (created_at DESC);
    `)

    if (webhookTableError) {
      console.error("Error creating webhook_logs table:", webhookTableError)
      return NextResponse.json({
        success: false,
        message: "Failed to create webhook_logs table",
        error: webhookTableError,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Supabase tables initialized successfully",
    })
  } catch (error) {
    console.error("Error initializing Supabase:", error)
    return NextResponse.json({
      success: false,
      message: "Failed to initialize Supabase",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
