import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import type { Metadata } from "next"

import { SchoolAssetsForm } from "@/components/school-assets-form"
import { db } from "@/db"
import { schoolProfile } from "@/db/schema"
import { auth } from "@/lib/auth"
import { createR2DownloadUrl } from "@/lib/r2"

export const metadata: Metadata = {
  title: "School Assets",
  description: "Manage school logos and stamp.",
}

export default async function SchoolAssetsPage() {
  const [session, profile] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    db.query.schoolProfile.findFirst({
      columns: {
        logoKey: true,
        foundationLogoKey: true,
        stampKey: true,
      },
      where: eq(schoolProfile.id, "main"),
    }),
  ])
  const [logo, foundationLogo, stamp] = await Promise.all(
    [profile?.logoKey, profile?.foundationLogoKey, profile?.stampKey].map(
      (key) => (key ? createR2DownloadUrl(key, 3600) : null)
    )
  )

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <SchoolAssetsForm
        canEdit={session?.user.role === "admin"}
        assetUrls={{ logo, foundationLogo, stamp }}
      />
    </div>
  )
}
