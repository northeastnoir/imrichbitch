"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

type TimeRange = "day" | "week" | "month" | "year" | "all"
type ChartData = {
  labels: string[]
  values: number[]
}

export function BalanceChart() {
  const [timeRange, setTimeRange] = useState<TimeRange>("month")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<any>(null)

  const fetchChartData = async (range: TimeRange) => {
    try {
      setLoading(true)
      setError(null)

      // In a real implementation, you would fetch from your API
      // const data = await fetch(`/api/balance-history?range=${range}`)
      // const chartData = await data.json()

      // For now, we'll use mock data
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate network delay
      const mockData = getMockChartData(range)

      setChartData(mockData)
    } catch (err) {
      console.error("Error fetching chart data:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  // Generate mock chart data based on time range
  const getMockChartData = (range: TimeRange): ChartData => {
    let dataPoints: number
    let startDate: Date
    let dateFormat: string

    switch (range) {
      case "day":
        dataPoints = 24
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
        dateFormat = "HH:mm"
        break
      case "week":
        dataPoints = 7
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        dateFormat = "EEE"
        break
      case "month":
        dataPoints = 30
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        dateFormat = "MMM d"
        break
      case "year":
        dataPoints = 12
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        dateFormat = "MMM"
        break
      case "all":
        dataPoints = 24
        startDate = new Date(Date.now() - 730 * 24 * 60 * 60 * 1000)
        dateFormat = "MMM yyyy"
        break
    }

    const labels: string[] = []
    const values: number[] = []

    // Start with a base value
    let currentValue = 10000

    for (let i = 0; i < dataPoints; i++) {
      // Generate date label
      const date = new Date(startDate)

      if (range === "day") {
        date.setHours(date.getHours() + i)
        labels.push(`${date.getHours()}:00`)
      } else if (range === "week") {
        date.setDate(date.getDate() + i)
        labels.push(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()])
      } else if (range === "month") {
        date.setDate(date.getDate() + i)
        labels.push(`${date.getDate()}/${date.getMonth() + 1}`)
      } else if (range === "year") {
        date.setMonth(date.getMonth() + i)
        labels.push(
          ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()],
        )
      } else {
        date.setMonth(date.getMonth() + i)
        labels.push(
          `${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()]} ${date.getFullYear()}`,
        )
      }

      // Generate a somewhat realistic balance progression
      // Add some randomness but with an overall upward trend
      const change = Math.random() * 6 - 2 // -2% to +4% change
      currentValue = currentValue * (1 + change / 100)

      values.push(Math.round(currentValue))
    }

    return { labels, values }
  }

  useEffect(() => {
    fetchChartData(timeRange)
  }, [timeRange])

  useEffect(() => {
    if (!chartData || !canvasRef.current) return

    const ctx = canvasRef.current.getContext("2d")
    if (!ctx) return

    // Clear previous chart if it exists
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy()
    }

    // Draw the chart
    drawChart(ctx, chartData)

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
      }
    }
  }, [chartData])

  const drawChart = (ctx: CanvasRenderingContext2D, data: ChartData) => {
    const { labels, values } = data

    // Set canvas dimensions
    const canvas = ctx.canvas
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // Calculate chart dimensions
    const padding = 40
    const chartWidth = canvas.width - padding * 2
    const chartHeight = canvas.height - padding * 2

    // Find min and max values
    const minValue = Math.min(...values) * 0.95
    const maxValue = Math.max(...values) * 1.05
    const valueRange = maxValue - minValue

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw axes
    ctx.beginPath()
    ctx.strokeStyle = "#333"
    ctx.lineWidth = 1
    ctx.moveTo(padding, padding)
    ctx.lineTo(padding, canvas.height - padding)
    ctx.lineTo(canvas.width - padding, canvas.height - padding)
    ctx.stroke()

    // Draw grid lines
    ctx.beginPath()
    ctx.strokeStyle = "#222"
    ctx.lineWidth = 0.5

    // Horizontal grid lines
    const numGridLines = 5
    for (let i = 0; i <= numGridLines; i++) {
      const y = padding + chartHeight * (i / numGridLines)
      ctx.moveTo(padding, y)
      ctx.lineTo(canvas.width - padding, y)

      // Add value labels
      const value = maxValue - valueRange * (i / numGridLines)
      ctx.fillStyle = "#666"
      ctx.font = "10px sans-serif"
      ctx.textAlign = "right"
      ctx.fillText(`$${Math.round(value).toLocaleString()}`, padding - 5, y + 3)
    }
    ctx.stroke()

    // Draw data points and line
    if (values.length > 1) {
      // Draw line
      ctx.beginPath()
      ctx.strokeStyle = "#b76e9b"
      ctx.lineWidth = 2

      // Create gradient for area fill
      const gradient = ctx.createLinearGradient(0, padding, 0, canvas.height - padding)
      gradient.addColorStop(0, "rgba(183, 110, 155, 0.3)")
      gradient.addColorStop(1, "rgba(183, 110, 155, 0)")

      // Draw data points and connect with line
      for (let i = 0; i < values.length; i++) {
        const x = padding + chartWidth * (i / (values.length - 1))
        const y = padding + chartHeight - chartHeight * ((values[i] - minValue) / valueRange)

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }

        // Draw x-axis labels
        if (i % Math.ceil(values.length / 10) === 0 || i === values.length - 1) {
          ctx.fillStyle = "#666"
          ctx.font = "10px sans-serif"
          ctx.textAlign = "center"
          ctx.fillText(labels[i], x, canvas.height - padding + 15)
        }
      }
      ctx.stroke()

      // Fill area under the line
      ctx.lineTo(padding + chartWidth, canvas.height - padding)
      ctx.lineTo(padding, canvas.height - padding)
      ctx.closePath()
      ctx.fillStyle = gradient
      ctx.fill()

      // Draw data points
      for (let i = 0; i < values.length; i++) {
        const x = padding + chartWidth * (i / (values.length - 1))
        const y = padding + chartHeight - chartHeight * ((values[i] - minValue) / valueRange)

        ctx.beginPath()
        ctx.arc(x, y, 3, 0, Math.PI * 2)
        ctx.fillStyle = "#b76e9b"
        ctx.fill()
        ctx.strokeStyle = "#fff"
        ctx.lineWidth = 1
        ctx.stroke()
      }
    }
  }

  return (
    <Card className="bg-black border-zinc-900 shadow-xl tech-glow">
      <CardHeader className="border-b border-zinc-900 pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-white">Balance History</CardTitle>
          <CardDescription>Account balance over time</CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <TabsList className="bg-zinc-900 border border-zinc-800">
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
              <TabsTrigger value="month">Month</TabsTrigger>
              <TabsTrigger value="year">Year</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            variant="ghost"
            size="icon"
            className="text-zinc-400 hover:text-white"
            onClick={() => fetchChartData(timeRange)}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        {loading && !chartData ? (
          <div className="flex justify-center items-center h-[300px]">
            <div className="animate-spin h-8 w-8 border-4 border-zinc-500 border-t-[#b76e9b] rounded-full"></div>
          </div>
        ) : error ? (
          <div className="text-red-400 text-center py-8 h-[300px] flex items-center justify-center">
            Error loading chart data: {error}
          </div>
        ) : (
          <div className="h-[300px] w-full">
            <canvas ref={canvasRef} className="w-full h-full"></canvas>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
