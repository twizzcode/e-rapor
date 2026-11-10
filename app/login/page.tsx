import { redirect } from "next/navigation"
import { SchoolIcon } from "lucide-react"
import type { Metadata } from "next"

import { LoginForm } from "@/components/login-form"
import { getSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to E-Rapor.",
}

export default async function LoginPage() {
  const session = await getSession()

  if (session) redirect("/")

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex items-center gap-2 self-center font-medium">
          <div className="flex size-7 items-center justify-center bg-primary text-primary-foreground">
            <SchoolIcon className="size-4" />
          </div>
          SDII Cahaya Bangsa
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
