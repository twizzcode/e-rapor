import { redirect } from "next/navigation"
import { ShieldXIcon } from "lucide-react"
import { eq } from "drizzle-orm"
import type { Metadata } from "next"

import { AccessDeniedActions } from "@/components/access-denied-actions"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getSession } from "@/lib/session"
import { db } from "@/db"
import { teacher } from "@/db/schema"

export const metadata: Metadata = {
  title: "Access Denied",
  description: "Your account cannot access E-Rapor.",
}

export default async function AccessDeniedPage() {
  const session = await getSession()

  if (!session) redirect("/login")

  const teacherProfile = await db.query.teacher.findFirst({
    columns: { active: true },
    where: eq(teacher.userId, session.user.id),
  })

  if (
    (session.user.role === "teacher" || session.user.role === "admin") &&
    teacherProfile?.active !== false
  ) {
    redirect("/")
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted p-6">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="items-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center bg-destructive/10 text-destructive">
            <ShieldXIcon className="size-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-xl">
            You&apos;re not part of SDII Cahaya Bangsa
          </CardTitle>
          <CardDescription>
            Akun {session.user.email} belum terdaftar atau sedang tidak aktif
            sebagai teacher atau admin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AccessDeniedActions />
        </CardContent>
      </Card>
    </main>
  )
}
