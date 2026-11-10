import { and, asc, count, eq, isNull, or } from "drizzle-orm"
import { headers } from "next/headers"
import type { Metadata } from "next"

import { ClassDataGrid } from "@/components/classes/class-data-grid"
import { db } from "@/db"
import { classGroup, classMember, teacher, user } from "@/db/schema"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Classes",
  description: "Manage classes and class members.",
}

export default async function ClassesPage() {
  const [session, classes, teachers] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    db
      .select({
        id: classGroup.id,
        name: classGroup.name,
        gradeLevel: classGroup.gradeLevel,
        homeroomTeacherId: classGroup.homeroomTeacherId,
        homeroomTeacher: user.name,
        studentCount: count(classMember.studentId),
      })
      .from(classGroup)
      .leftJoin(user, eq(user.id, classGroup.homeroomTeacherId))
      .leftJoin(classMember, eq(classMember.classId, classGroup.id))
      .groupBy(classGroup.id, user.name)
      .orderBy(asc(classGroup.gradeLevel), asc(classGroup.name)),
    db
      .select({ id: user.id, name: user.name })
      .from(user)
      .leftJoin(teacher, eq(teacher.userId, user.id))
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
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Classes
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage class groups, homeroom teachers, and student membership.
        </p>
      </div>
      <ClassDataGrid
        initialClasses={classes.map((row) => ({
          ...row,
          gradeLevel: String(row.gradeLevel),
          homeroomTeacherId: row.homeroomTeacherId ?? "",
          homeroomTeacher: row.homeroomTeacher ?? "",
        }))}
        teachers={teachers}
        canManage={session?.user.role === "admin"}
      />
    </div>
  )
}
