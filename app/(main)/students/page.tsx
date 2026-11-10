import { asc } from "drizzle-orm"
import { headers } from "next/headers"
import type { Metadata } from "next"

import { StudentList } from "@/components/students/student-list"
import { db } from "@/db"
import { student } from "@/db/schema"
import { auth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Students",
  description: "Manage student records.",
}

export default async function StudentsPage() {
  const [session, students] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    db.select().from(student).orderBy(asc(student.name)),
  ])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <StudentList
        canManage={session?.user.role === "admin"}
        students={students.map((row) => ({
          id: row.id,
          name: row.name,
          nis: row.nis,
          nisn: row.nisn ?? "",
          gender: row.gender ?? "",
          birthPlace: row.birthPlace ?? "",
          birthDate: row.birthDate ?? "",
          gradeLevel: row.gradeLevel,
          className: row.className,
        }))}
      />
    </div>
  )
}
