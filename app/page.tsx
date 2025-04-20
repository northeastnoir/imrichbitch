"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"

export default function Home() {
  const [showPasswordBox, setShowPasswordBox] = useState(false)
  const [password, setPassword] = useState("")
  const [matrixActive, setMatrixActive] = useState(false)
  const [exitClicks, setExitClicks] = useState(0)
  const [error, setError] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()

  // Matrix animation
  useEffect(() => {
    if (!matrixActive || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    // Characters to display (only binary 0s and 1s)
    const chars = "01"
    const fontSize = 14
    const columns = Math.floor(canvas.width / fontSize)

    // Array to track the y position of each column
    const drops: number[] = Array(columns).fill(1)

    // Drawing function
    const draw = () => {
      // Semi-transparent black to create fade effect
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Set the character style to white
      ctx.fillStyle = "#FFFFFF" // White for all numbers
      ctx.font = `${fontSize}px monospace`

      // Draw falling characters
      for (let i = 0; i < drops.length; i++) {
        // Random binary character (0 or 1)
        const char = chars[Math.floor(Math.random() * chars.length)]

        // Draw the character
        const x = i * fontSize
        const y = drops[i] * fontSize
        ctx.fillText(char, x, y)

        // Move to next position or reset
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0
        }
        drops[i]++
      }
    }

    // Animation loop
    const interval = setInterval(draw, 33) // ~30fps

    // Handle window resize
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    window.addEventListener("resize", handleResize)

    return () => {
      clearInterval(interval)
      window.removeEventListener("resize", handleResize)
    }
  }, [matrixActive])

  // Handle key press for "777"
  useEffect(() => {
    const keySequence: string[] = []

    const handleKeyDown = (e: KeyboardEvent) => {
      keySequence.push(e.key)

      // Keep only the last 3 keys
      if (keySequence.length > 3) {
        keySequence.shift()
      }

      // Check if the sequence is "777"
      if (keySequence.join("") === "777") {
        setShowPasswordBox(true)
        setMatrixActive(true)
        keySequence.length = 0 // Clear the sequence
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  // Handle exit clicks
  const handleExitClick = () => {
    const newCount = exitClicks + 1
    setExitClicks(newCount)

    if (newCount >= 3) {
      setMatrixActive(false)

      // Check password - use hardcoded password instead of env variable
      const accessPassword = "NortheastNoir777!"
      // Trim whitespace and normalize case for comparison
      const normalizedInput = password.trim()
      const normalizedStored = accessPassword.trim()

      if (normalizedInput === normalizedStored) {
        // Store auth in localStorage
        try {
          localStorage.setItem("super777-auth", "true")
          router.push("/dashboard")
        } catch (error) {
          console.error("Error setting localStorage:", error)
          setError("Browser storage error. Please enable cookies.")
        }
      } else {
        setError("Invalid password")
        setTimeout(() => setError(""), 3000)
      }
    }
  }

  return (
    <div className="relative min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Matrix canvas */}
      {matrixActive && <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />}

      {/* Content */}
      <div className="relative z-10 text-center">
        <h1 className="text-[2.145rem] font-bold tracking-tighter italic">
          <span className="text-white">SUPER</span>
          <span className="text-[#b76e9b]">777</span>
        </h1>

        {showPasswordBox && (
          <div className="relative">
            <div className="flex items-center bg-zinc-900/70 border border-zinc-800/50 rounded-md px-4 py-2 w-32 mx-auto">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-transparent border-none text-white w-full focus:outline-none"
                placeholder=""
              />
            </div>

            {error && <div className="absolute -bottom-8 left-0 right-0 text-red-500 text-sm">{error}</div>}
          </div>
        )}

        {matrixActive && (
          <button
            onClick={handleExitClick}
            className="mt-8 px-6 py-2 bg-transparent text-white/70 hover:text-white/90 transition-colors text-sm italic shadow-[0_0_10px_#FFFF00] hover:shadow-[0_0_15px_#FFFF00]"
          >
            exit the matrix
          </button>
        )}
      </div>
    </div>
  )
}
