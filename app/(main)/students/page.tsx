import { asc, eq } from "drizzle-orm"
import type { Metadata } from "next"

import { StudentList } from "@/components/students/student-list"
import { db } from "@/db"
import { classGroup, classMember, student } from "@/db/schema"
import { getSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Students",
  description: "Manage student records.",
}

export default async function StudentsPage() {
  const [session, students] = await Promise.all([
    getSession(),
    db
      .select({
        id: student.id,
        name: student.name,
        nis: student.nis,
        nisn: student.nisn,
        gender: student.gender,
        birthPlace: student.birthPlace,
        birthDate: student.birthDate,
        className: classGroup.name,
      })
      .from(student)
      .leftJoin(classMember, eq(classMember.studentId, student.id))
      .leftJoin(classGroup, eq(classGroup.id, classMember.classId))
      .orderBy(asc(student.name)),
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
          className: row.className,
        }))}
      />
    </div>
  )
}
