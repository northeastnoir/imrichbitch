"use client"

import { CredentialChecker } from "@/components/credential-checker"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

export default function CredentialsPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-black text-white p-4 md:p-6">
      <header className="mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/dashboard")}
              className="mr-2 text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tighter italic">
              <span className="text-white">SUPER</span>
              <span className="text-[#b76e9b]">777</span>
              <span className="text-white ml-2 text-sm font-normal tracking-normal">API Credentials</span>
            </h1>
          </div>
        </div>
      </header>

      <CredentialChecker />

      <div className="mt-6">
        <h2 className="text-xl font-bold mb-4">How to Fix Credential Issues</h2>

        <div className="space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-4">
            <h3 className="text-lg font-medium mb-2">HMAC Authentication (Recommended)</h3>
            <p className="mb-4">HMAC authentication is the simplest method and works well for most users.</p>

            <ol className="list-decimal pl-5 space-y-2 text-sm text-zinc-400">
              <li>
                Go to your{" "}
                <a
                  href="https://www.coinbase.com/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#b76e9b] hover:underline"
                >
                  Coinbase Advanced Trade API settings
                </a>
              </li>
              <li>Click "New API Key"</li>
              <li>Select the permissions you need (View and Trade are recommended)</li>
              <li>Copy the API Key and API Secret</li>
              <li>Add them to your Vercel environment variables as COINBASE_API_KEY and COINBASE_API_SECRET</li>
              <li>Redeploy your application</li>
            </ol>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-md p-4">
            <h3 className="text-lg font-medium mb-2">JWT Authentication (Advanced)</h3>
            <p className="mb-4">JWT authentication requires a private key in PKCS#8 format.</p>

            <ol className="list-decimal pl-5 space-y-2 text-sm text-zinc-400">
              <li>
                Generate a key pair using OpenSSL:
                <pre className="bg-black p-2 rounded mt-1 text-xs overflow-x-auto">
                  openssl genpkey -algorithm EC -pkeyopt ec_paramgen_curve:P-256 -out private.pem
                </pre>
              </li>
              <li>
                Extract the public key:
                <pre className="bg-black p-2 rounded mt-1 text-xs overflow-x-auto">
                  openssl ec -in private.pem -pubout -out public.pem
                </pre>
              </li>
              <li>
                Go to your{" "}
                <a
                  href="https://www.coinbase.com/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#b76e9b] hover:underline"
                >
                  Coinbase Advanced Trade API settings
                </a>
              </li>
              <li>Click "New API Key"</li>
              <li>Select "Public Key" authentication method</li>
              <li>Paste the contents of public.pem</li>
              <li>Add the API Key to your Vercel environment variables as COINBASE_API_KEY</li>
              <li>Add the contents of private.pem to your Vercel environment variables as COINBASE_PRIVATE_KEY</li>
              <li>Redeploy your application</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}
