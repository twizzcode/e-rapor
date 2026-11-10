"use client"

import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth-client"

export function AccessDeniedActions() {
  const router = useRouter()

  async function handleSignOut() {
    await authClient.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-2">
      <Button onClick={() => router.refresh()}>Check access again</Button>
      <Button variant="outline" onClick={handleSignOut}>
        Sign in with another account
      </Button>
    </div>
  )
}
