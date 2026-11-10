import { asc } from "drizzle-orm"
import type { Metadata } from "next"

import { SubjectAssessmentGrid } from "@/components/subjects/subject-assessment-grid"
import { db } from "@/db"
import { assessmentDescriptor, subject } from "@/db/schema"
import { getSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Subjects",
  description: "Manage subjects and assessment descriptions.",
}

export default async function SubjectsPage() {
  const [session, subjects, descriptors] = await Promise.all([
    getSession(),
    db.select().from(subject).orderBy(asc(subject.name)),
    db.select().from(assessmentDescriptor),
  ])
  const levels = ["Exceeding", "Meeting", "Developing", "Emerging"]
  const descriptorMap = new Map(
    descriptors.map((row) => [`${row.subjectId}:${row.level}`, row])
  )
  const assessmentRows = subjects.flatMap((subjectRow) =>
    levels.map((level) => {
      const descriptor = descriptorMap.get(`${subjectRow.id}:${level}`)
      return {
        id: descriptor?.id ?? `${subjectRow.id}-${level.toLowerCase()}`,
        subjectId: subjectRow.id,
        subject: subjectRow.name,
        level,
        description: descriptor?.description ?? "",
      }
    })
  )

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <SubjectAssessmentGrid
        rows={assessmentRows}
        canManage={session?.user.role === "admin"}
      />
    </div>
  )
}
