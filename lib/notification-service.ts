type NotificationLevel = "info" | "warning" | "error" | "success"

type NotificationOptions = {
  title: string
  message: string
  level: NotificationLevel
  data?: any
  timestamp?: string
}

type EmailOptions = {
  to: string
  subject: string
  body: string
  isHtml?: boolean
}

class NotificationService {
  private static instance: NotificationService
  private notifications: NotificationOptions[] = []
  private maxNotifications = 100
  private emailEnabled = false
  private emailConfig = {
    defaultRecipient: "",
    fromAddress: "notifications@super777.com",
  }

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Configure email notifications
   */
  public configureEmail(enabled: boolean, defaultRecipient?: string): void {
    this.emailEnabled = enabled
    if (defaultRecipient) {
      this.emailConfig.defaultRecipient = defaultRecipient
    }
  }

  /**
   * Send a notification
   */
  public async notify(options: NotificationOptions): Promise<void> {
    // Add timestamp if not provided
    if (!options.timestamp) {
      options.timestamp = new Date().toISOString()
    }

    // Add to notifications array
    this.notifications.unshift(options)

    // Trim notifications to max size
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications)
    }

    // Log to console
    this.logToConsole(options)

    // Send email if enabled and level is warning or error
    if (this.emailEnabled && (options.level === "warning" || options.level === "error")) {
      await this.sendEmail({
        to: this.emailConfig.defaultRecipient,
        subject: `SUPER777 ${options.level.toUpperCase()}: ${options.title}`,
        body: this.formatEmailBody(options),
        isHtml: true,
      })
    }
  }

  /**
   * Send an info notification
   */
  public async info(title: string, message: string, data?: any): Promise<void> {
    await this.notify({
      title,
      message,
      level: "info",
      data,
    })
  }

  /**
   * Send a warning notification
   */
  public async warning(title: string, message: string, data?: any): Promise<void> {
    await this.notify({
      title,
      message,
      level: "warning",
      data,
    })
  }

  /**
   * Send an error notification
   */
  public async error(title: string, message: string, data?: any): Promise<void> {
    await this.notify({
      title,
      message,
      level: "error",
      data,
    })
  }

  /**
   * Send a success notification
   */
  public async success(title: string, message: string, data?: any): Promise<void> {
    await this.notify({
      title,
      message,
      level: "success",
      data,
    })
  }

  /**
   * Get all notifications
   */
  public getNotifications(level?: NotificationLevel, limit = 50): NotificationOptions[] {
    if (level) {
      return this.notifications.filter((n) => n.level === level).slice(0, limit)
    }
    return this.notifications.slice(0, limit)
  }

  /**
   * Clear all notifications
   */
  public clearNotifications(): void {
    this.notifications = []
  }

  /**
   * Send an email
   */
  private async sendEmail(options: EmailOptions): Promise<void> {
    // This is a placeholder for actual email sending logic
    // In a real implementation, you would use a service like SendGrid, Mailgun, etc.
    console.log(`[EMAIL] To: ${options.to}, Subject: ${options.subject}`)
    console.log(`[EMAIL] Body: ${options.body.substring(0, 100)}...`)

    // For now, we'll just log that we would send an email
    // In a real implementation, you would make an API call to your email service
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 100))
      console.log(`[EMAIL] Successfully sent email to ${options.to}`)
    } catch (error) {
      console.error(`[EMAIL] Failed to send email: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  /**
   * Format email body
   */
  private formatEmailBody(notification: NotificationOptions): string {
    const timestamp = new Date(notification.timestamp || new Date()).toLocaleString()

    return `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ccc; border-radius: 5px;">
        <h2 style="color: ${this.getLevelColor(notification.level)};">${notification.title}</h2>
        <p>${notification.message}</p>
        <p style="color: #666; font-size: 12px;">Timestamp: ${timestamp}</p>
        ${notification.data ? `<pre style="background: #f5f5f5; padding: 10px; border-radius: 3px; overflow: auto;">${JSON.stringify(notification.data, null, 2)}</pre>` : ""}
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
        <p style="color: #666; font-size: 12px;">This is an automated notification from your SUPER777 trading system.</p>
      </div>
    `
  }

  /**
   * Log notification to console
   */
  private logToConsole(notification: NotificationOptions): void {
    const timestamp = new Date(notification.timestamp || new Date()).toLocaleString()
    const prefix = `[${notification.level.toUpperCase()}] [${timestamp}]`

    switch (notification.level) {
      case "info":
        console.info(`${prefix} ${notification.title}: ${notification.message}`, notification.data || "")
        break
      case "warning":
        console.warn(`${prefix} ${notification.title}: ${notification.message}`, notification.data || "")
        break
      case "error":
        console.error(`${prefix} ${notification.title}: ${notification.message}`, notification.data || "")
        break
      case "success":
        console.log(`${prefix} ${notification.title}: ${notification.message}`, notification.data || "")
        break
    }
  }

  /**
   * Get color for notification level
   */
  private getLevelColor(level: NotificationLevel): string {
    switch (level) {
      case "info":
        return "#3498db"
      case "warning":
        return "#f39c12"
      case "error":
        return "#e74c3c"
      case "success":
        return "#2ecc71"
      default:
        return "#333333"
    }
  }
}

// Export singleton instance
export const notifications = NotificationService.getInstance()
