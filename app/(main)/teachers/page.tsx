import { asc, eq, or } from "drizzle-orm"
import type { Metadata } from "next"

import { TeacherDataGrid } from "@/components/teachers/teacher-data-grid"
import { db } from "@/db"
import { teacher, user } from "@/db/schema"
import { getSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Teachers",
  description: "Manage teacher accounts.",
}

export default async function TeachersPage() {
  const session = await getSession()
  const rows = await db
    .select({
      id: user.id,
      fullName: user.name,
      email: user.email,
      role: user.role,
      active: teacher.active,
    })
    .from(user)
    .leftJoin(teacher, eq(teacher.userId, user.id))
    .where(or(eq(user.role, "teacher"), eq(user.role, "admin")))
    .orderBy(asc(user.name))

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <TeacherDataGrid
        canManage={session?.user.role === "admin"}
        initialTeachers={rows.map((row) => ({
          id: row.id,
          fullName: row.fullName,
          email: row.email,
          status: row.active === false ? "Inactive" : "Active",
          role: row.role === "admin" ? "Admin Teacher" : "Teacher",
        }))}
      />
    </div>
  )
}
