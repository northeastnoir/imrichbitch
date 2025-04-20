import { ConnectionTest } from "@/components/connection-test"

export default function TestPage() {
  return (
    <div className="min-h-screen bg-black p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-6">Connection Test Page</h1>
        <ConnectionTest />
      </div>
    </div>
  )
}
