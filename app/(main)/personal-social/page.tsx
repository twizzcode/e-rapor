import { asc } from "drizzle-orm"
import { headers } from "next/headers"
import type { Metadata } from "next"

import { PersonalSocialGrid } from "@/components/personal-social/personal-social-grid"
import { db } from "@/db"
import { personalSocialRubric } from "@/db/schema"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Personal & Social",
  description: "Manage personal and social assessment descriptions.",
}

export default async function PersonalSocialPage() {
  const [session, rows] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    db
      .select({
        id: personalSocialRubric.id,
        aspect: personalSocialRubric.aspect,
        exceeding: personalSocialRubric.exceeding,
        meeting: personalSocialRubric.meeting,
        developing: personalSocialRubric.developing,
        emerging: personalSocialRubric.emerging,
      })
      .from(personalSocialRubric)
      .orderBy(asc(personalSocialRubric.position)),
  ])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <PersonalSocialGrid
        initialRows={rows}
        canManage={session?.user.role === "admin"}
      />
    </div>
  )
}
