import { eq } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"

import { ClassForm } from "@/components/classes/class-form"
import { db } from "@/db"
import { classGroup } from "@/db/schema"
import { getSession } from "@/lib/session"
import { getActiveTeacherOptions } from "@/lib/class-options"

export const metadata: Metadata = {
  title: "Edit Class",
  description: "Update class information.",
}

export default async function EditClassPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [{ id }, session, teachers] = await Promise.all([
    params,
    getSession(),
    getActiveTeacherOptions(),
  ])
  if (session?.user.role !== "admin") redirect(`/classes/${id}`)

  const row = await db.query.classGroup.findFirst({
    where: eq(classGroup.id, id),
  })
  if (!row) notFound()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Edit Class
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Update {row.name} information.
        </p>
      </div>
      <ClassForm
        teachers={teachers}
        classData={{
          id: row.id,
          name: row.name,
          gradeLevel: row.gradeLevel,
          homeroomTeacherId: row.homeroomTeacherId ?? "",
        }}
      />
    </div>
  )
}
