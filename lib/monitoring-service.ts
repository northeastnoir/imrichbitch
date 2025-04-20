type LogLevel = "debug" | "info" | "warn" | "error"

type LogEntry = {
  timestamp: string
  level: LogLevel
  message: string
  data?: any
}

type TradeEvent = {
  orderId: string
  productId: string
  side: "BUY" | "SELL"
  size: string
  price?: string
  status: string
  timestamp: string
}

class MonitoringService {
  private logs: LogEntry[] = []
  private tradeEvents: TradeEvent[] = []
  private maxLogEntries = 1000
  private maxTradeEvents = 100

  // Singleton pattern
  private static instance: MonitoringService

  private constructor() {}

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService()
    }
    return MonitoringService.instance
  }

  // Logging methods
  public log(level: LogLevel, message: string, data?: any): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    }

    // Add to logs array, maintaining max size
    this.logs.unshift(logEntry)
    if (this.logs.length > this.maxLogEntries) {
      this.logs = this.logs.slice(0, this.maxLogEntries)
    }

    // Also log to console
    switch (level) {
      case "debug":
        console.debug(message, data)
        break
      case "info":
        console.info(message, data)
        break
      case "warn":
        console.warn(message, data)
        break
      case "error":
        console.error(message, data)
        break
    }

    // Here you could send logs to an external service
    this.sendToExternalService(logEntry)
  }

  public debug(message: string, data?: any): void {
    this.log("debug", message, data)
  }

  public info(message: string, data?: any): void {
    this.log("info", message, data)
  }

  public warn(message: string, data?: any): void {
    this.log("warn", message, data)
  }

  public error(message: string, data?: any): void {
    this.log("error", message, data)
  }

  // Trade event tracking
  public recordTradeEvent(event: TradeEvent): void {
    // Add to trade events array, maintaining max size
    this.tradeEvents.unshift(event)
    if (this.tradeEvents.length > this.maxTradeEvents) {
      this.tradeEvents = this.tradeEvents.slice(0, this.maxTradeEvents)
    }

    // Log the trade event
    this.info(`Trade event: ${event.side} ${event.size} ${event.productId} @ ${event.price || "MARKET"}`, event)
  }

  // Get logs and trade events
  public getLogs(level?: LogLevel, limit = 100): LogEntry[] {
    if (level) {
      return this.logs.filter((log) => log.level === level).slice(0, limit)
    }
    return this.logs.slice(0, limit)
  }

  public getTradeEvents(limit = 100): TradeEvent[] {
    return this.tradeEvents.slice(0, limit)
  }

  // Clear logs and trade events
  public clearLogs(): void {
    this.logs = []
  }

  public clearTradeEvents(): void {
    this.tradeEvents = []
  }

  // Send logs to external service (placeholder)
  private sendToExternalService(logEntry: LogEntry): void {
    // This would be implemented to send logs to a service like Sentry, LogRocket, etc.
    // For now, it's just a placeholder
    if (logEntry.level === "error" && typeof window !== "undefined") {
      // Example: send errors to an external service
      // externalErrorService.captureException(logEntry)
    }
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance()
