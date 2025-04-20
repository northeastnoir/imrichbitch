"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Error caught by ErrorBoundary:", error, errorInfo)

    // Here you could send the error to an error reporting service
    // Example: reportError(error, errorInfo)
  }

  resetErrorBoundary = (): void => {
    if (this.props.onReset) {
      this.props.onReset()
    }
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-md flex flex-col items-center justify-center text-center">
          <AlertTriangle className="h-10 w-10 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-red-400 mb-2">Something went wrong</h3>
          <p className="text-sm text-zinc-400 mb-4">{this.state.error?.message || "An unexpected error occurred"}</p>
          <Button
            onClick={this.resetErrorBoundary}
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
