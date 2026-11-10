import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import type { Metadata } from "next"

import { ProfileForm } from "@/components/profile-form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { db } from "@/db"
import { teacher } from "@/db/schema"
import { auth } from "@/lib/auth"
import { createR2DownloadUrl } from "@/lib/r2"

export const metadata: Metadata = {
  title: "My Profile",
  description: "Manage your teacher profile and signature.",
}

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect("/login")

  const teacherProfile = await db.query.teacher.findFirst({
    where: eq(teacher.userId, session.user.id),
  })
  const signatureUrl = teacherProfile?.signatureKey
    ? await createR2DownloadUrl(teacherProfile.signatureKey, 3600)
    : null

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Profil Saya
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola data akun dan data pribadi teacher.
        </p>
      </div>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Data pribadi</CardTitle>
          <CardDescription>
            Data ini tersimpan sebagai profil teacher SDII Cahaya Bangsa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm
            signatureUrl={signatureUrl}
            profile={{
              name: session.user.name,
              email: session.user.email,
              nip: teacherProfile?.nip ?? "",
              nuptk: teacherProfile?.nuptk ?? "",
              gender: teacherProfile?.gender ?? "",
              ptkType: teacherProfile?.ptkType ?? "",
              birthDate: teacherProfile?.birthDate ?? "",
              phone: teacherProfile?.phone ?? "",
              address: teacherProfile?.address ?? "",
              village: teacherProfile?.village ?? "",
              district: teacherProfile?.district ?? "",
              regency: teacherProfile?.regency ?? "",
              province: teacherProfile?.province ?? "",
              postalCode: teacherProfile?.postalCode ?? "",
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
