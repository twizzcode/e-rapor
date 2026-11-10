"use server"

import type { BatchItem } from "drizzle-orm/batch"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "@/db"
import { personalSocialRubric } from "@/db/schema"
import { getSession } from "@/lib/session"

export type PersonalSocialRow = {
  id: string
  aspect: string
  exceeding: string
  meeting: string
  developing: string
  emerging: string
}

export async function savePersonalSocialRubric(
  rows: PersonalSocialRow[],
  deletedIds: string[]
) {
  const session = await getSession()
  if (!session || session.user.role !== "admin") {
    return { error: "Only an Admin Teacher can manage this rubric." }
  }
  if (rows.length > 100 || deletedIds.length > 100) {
    return { error: "Too many aspects in one request." }
  }

  const normalizedRows = rows.map((row) => ({
    id: typeof row.id === "string" ? row.id.trim() : "",
    aspect: typeof row.aspect === "string" ? row.aspect.trim() : "",
    exceeding: typeof row.exceeding === "string" ? row.exceeding.trim() : "",
    meeting: typeof row.meeting === "string" ? row.meeting.trim() : "",
    developing: typeof row.developing === "string" ? row.developing.trim() : "",
    emerging: typeof row.emerging === "string" ? row.emerging.trim() : "",
  }))

  if (
    normalizedRows.some(
      (row) =>
        !row.id ||
        row.id.length > 100 ||
        !row.aspect ||
        row.aspect.length > 100 ||
        [row.exceeding, row.meeting, row.developing, row.emerging].some(
          (description) => description.length > 1000
        )
    )
  ) {
    return { error: "Every aspect must contain valid data." }
  }

  const names = normalizedRows.map((row) => row.aspect.toLocaleLowerCase())
  if (new Set(names).size !== names.length) {
    return { error: "Aspect names must be unique." }
  }

  const normalizedDeletedIds = deletedIds.map((id) =>
    typeof id === "string" ? id.trim() : ""
  )
  if (normalizedDeletedIds.some((id) => !id || id.length > 100)) {
    return { error: "Invalid aspect ID." }
  }

  try {
    const queries: BatchItem<"pg">[] = normalizedDeletedIds.map((id) =>
      db.delete(personalSocialRubric).where(eq(personalSocialRubric.id, id))
    )

    normalizedRows.forEach((row, position) => {
      queries.push(
        db
          .insert(personalSocialRubric)
          .values({ ...row, position })
          .onConflictDoUpdate({
            target: personalSocialRubric.id,
            set: { ...row, position, updatedAt: new Date() },
          })
      )
    })

    if (queries.length > 0) {
      await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]])
    }
  } catch (error) {
    console.error("Failed to save personal and social rubric", error)
    return { error: "Could not save rubric. Aspect names must be unique." }
  }

  revalidatePath("/personal-social")
  return { success: "Personal and social rubric saved.", rows: normalizedRows }
}
