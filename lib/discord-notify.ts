import { monitoring } from "./monitoring-service"

export async function notifyDiscord({
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
  const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL

  if (!discordWebhookUrl) {
    monitoring.warn("Discord webhook URL not configured")
    return { success: false, message: "Discord webhook URL not configured" }
  }

  try {
    // Format the trade result for better readability
    const formattedAction = typeof action === "string" ? action.toUpperCase() : action
    const emoji = formattedAction === "BUY" || formattedAction === "LONG" ? "🟢" : "🔴"
    const status = tradeResult?.status || "UNKNOWN"
    const statusEmoji =
      status === "FILLED" || status === "DONE" ? "✅" : status === "PENDING" || status === "OPEN" ? "⏳" : "❓"

    // Create the Discord message
    const message = {
      embeds: [
        {
          title: `${emoji} Trade Executed: ${formattedAction} ${ticker}`,
          color: formattedAction === "BUY" || formattedAction === "LONG" ? 5763719 : 15548997, // Green or Red
          fields: [
            {
              name: "Order Details",
              value: `**Quantity:** ${quantity}\n**Price:** ${price || "MARKET"}\n**Status:** ${statusEmoji} ${status}`,
              inline: true,
            },
            {
              name: "Order ID",
              value: tradeResult?.orderId ? `\`${tradeResult.orderId.substring(0, 10)}...\`` : "N/A",
              inline: true,
            },
            {
              name: "Timestamp",
              value: `<t:${Math.floor(Date.now() / 1000)}:F>`,
              inline: true,
            },
          ],
          footer: {
            text: "SUPER777 Trading Bot",
          },
          timestamp: new Date().toISOString(),
        },
      ],
    }

    // Send the message to Discord
    const response = await fetch(discordWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      const errorText = await response.text()
      monitoring.error("Discord notification failed", {
        status: response.status,
        error: errorText,
      })
      return { success: false, error: errorText }
    }

    monitoring.info("Discord notification sent", { ticker, action })
    return { success: true }
  } catch (error) {
    monitoring.error("Discord notification error", {
      error: error instanceof Error ? error.message : "Unknown error",
    })
    console.error("Discord notification error:", error)
    return { success: false, error }
  }
}
