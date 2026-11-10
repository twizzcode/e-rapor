"use server"

import type { BatchItem } from "drizzle-orm/batch"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "@/db"
import { assessmentDescriptor, subject } from "@/db/schema"
import { getSession } from "@/lib/session"

export type SubjectAssessmentRow = {
  id: string
  subjectId: string
  subject: string
  level: string
  description: string
}

const levels = ["Exceeding", "Meeting", "Developing", "Emerging"]

export async function saveSubjects(
  rows: SubjectAssessmentRow[],
  deletedSubjectIds: string[]
) {
  const session = await getSession()
  if (!session || session.user.role !== "admin") {
    return { error: "Only an Admin Teacher can manage subjects." }
  }
  if (rows.length > 800 || deletedSubjectIds.length > 200) {
    return { error: "Too many subjects in one request." }
  }

  const normalizedRows = rows.map((row) => ({
    id: typeof row.id === "string" ? row.id.trim() : "",
    subjectId: typeof row.subjectId === "string" ? row.subjectId.trim() : "",
    subject: typeof row.subject === "string" ? row.subject.trim() : "",
    level: typeof row.level === "string" ? row.level.trim() : "",
    description:
      typeof row.description === "string" ? row.description.trim() : "",
  }))
  const subjectGroups = new Map<string, SubjectAssessmentRow[]>()

  for (const row of normalizedRows) {
    if (
      !row.id ||
      row.id.length > 100 ||
      !row.subjectId ||
      row.subjectId.length > 100 ||
      !row.subject ||
      row.subject.length > 100 ||
      !levels.includes(row.level) ||
      row.description.length > 1000
    ) {
      return { error: "Every subject row must contain valid data." }
    }
    const group = subjectGroups.get(row.subjectId)
    if (group) group.push(row)
    else subjectGroups.set(row.subjectId, [row])
  }

  const names = [...subjectGroups.values()].map((group) =>
    group[0].subject.toLocaleLowerCase()
  )
  if (new Set(names).size !== names.length) {
    return { error: "Subject names must be unique." }
  }
  for (const group of subjectGroups.values()) {
    if (
      group.length !== levels.length ||
      new Set(group.map((row) => row.level)).size !== levels.length ||
      group.some((row) => row.subject !== group[0].subject)
    ) {
      return { error: "Each subject must contain all four assessment levels." }
    }
  }

  const normalizedDeletedIds = deletedSubjectIds.map((id) =>
    typeof id === "string" ? id.trim() : ""
  )
  if (normalizedDeletedIds.some((id) => !id || id.length > 100)) {
    return { error: "Invalid subject ID." }
  }

  try {
    const queries: BatchItem<"pg">[] = []

    for (const id of normalizedDeletedIds) {
      queries.push(db.delete(subject).where(eq(subject.id, id)))
    }

    for (const [subjectId, group] of subjectGroups) {
      queries.push(
        db
          .insert(subject)
          .values({ id: subjectId, name: group[0].subject })
          .onConflictDoUpdate({
            target: subject.id,
            set: { name: group[0].subject, updatedAt: new Date() },
          })
      )

      for (const row of group) {
        queries.push(
          db
            .insert(assessmentDescriptor)
            .values({
              id: row.id,
              subjectId,
              level: row.level,
              description: row.description,
            })
            .onConflictDoUpdate({
              target: [
                assessmentDescriptor.subjectId,
                assessmentDescriptor.level,
              ],
              set: { description: row.description, updatedAt: new Date() },
            })
        )
      }
    }

    if (queries.length > 0) {
      await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]])
    }
  } catch (error) {
    console.error("Failed to save subjects", error)
    return { error: "Could not save subjects. Subject names must be unique." }
  }

  revalidatePath("/subjects")
  return { success: "Subject and assessment data saved.", rows: normalizedRows }
}
