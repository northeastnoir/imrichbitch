import { NextResponse } from "next/server"
import { generateCoinbaseJWT } from "@/lib/coinbase-jwt"

export async function POST(request: Request) {
  try {
    const { method, path, body } = await request.json()

    if (!method || !path) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate JWT token
    const jwt = await generateCoinbaseJWT(method, path, body || null)

    return NextResponse.json({ jwt })
  } catch (error) {
    console.error("Error generating JWT:", error)

    return NextResponse.json(
      {
        error: "Failed to generate JWT",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
