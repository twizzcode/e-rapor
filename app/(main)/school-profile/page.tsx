import { and, asc, eq, isNull, or } from "drizzle-orm"
import { headers } from "next/headers"
import type { Metadata } from "next"

import { SchoolProfileForm } from "@/components/school-profile-form"
import { db } from "@/db"
import { schoolProfile, teacher, user } from "@/db/schema"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "School Profile",
  description: "Manage school information.",
}

export default async function SchoolProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  const [profile, teachers] = await Promise.all([
    db.query.schoolProfile.findFirst({
      where: eq(schoolProfile.id, "main"),
    }),
    db
      .select({
        id: user.id,
        name: user.name,
        nip: teacher.nip,
      })
      .from(user)
      .leftJoin(teacher, eq(user.id, teacher.userId))
      .where(
        and(
          or(eq(user.role, "teacher"), eq(user.role, "admin")),
          or(eq(teacher.active, true), isNull(teacher.active))
        )
      )
      .orderBy(asc(user.name)),
  ])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <SchoolProfileForm
        canEdit={session?.user.role === "admin"}
        teachers={teachers}
        profile={{
          name: profile?.name ?? "",
          educationLevel: profile?.educationLevel ?? "",
          nss: profile?.nss ?? "",
          npsn: profile?.npsn ?? "",
          street: profile?.street ?? "",
          village: profile?.village ?? "",
          district: profile?.district ?? "",
          regency: profile?.regency ?? "",
          province: profile?.province ?? "",
          postalCode: profile?.postalCode ?? "",
          phoneFax: profile?.phoneFax ?? "",
          email: profile?.email ?? "",
          website: profile?.website ?? "",
          principalUserId: profile?.principalUserId ?? "",
        }}
      />
    </div>
  )
}
