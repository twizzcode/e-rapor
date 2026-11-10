import { eq } from "drizzle-orm"
import { notFound, redirect } from "next/navigation"
import type { Metadata } from "next"

import { StudentForm } from "@/components/students/student-form"
import { db } from "@/db"
import { student } from "@/db/schema"
import { getSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Edit Student",
  description: "Update student information.",
}

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [{ id }, session] = await Promise.all([
    params,
    getSession(),
  ])
  if (session?.user.role !== "admin") redirect(`/students/${id}`)

  const row = await db.query.student.findFirst({ where: eq(student.id, id) })
  if (!row) notFound()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <StudentForm
        student={{
          id: row.id,
          name: row.name,
          nisn: row.nisn ?? "",
          nis: row.nis,
          admissionDate: row.admissionDate ?? "",
          birthPlace: row.birthPlace ?? "",
          birthDate: row.birthDate ?? "",
          gender: row.gender ?? "",
          religion: row.religion ?? "",
          street: row.street ?? "",
          village: row.village ?? "",
          district: row.district ?? "",
          regency: row.regency ?? "",
          province: row.province ?? "",
          postalCode: row.postalCode ?? "",
          familyStatus: row.familyStatus ?? "",
          childOrder: row.childOrder?.toString() ?? "",
          previousSchool: row.previousSchool ?? "",
          admittedClass: row.admittedClass ?? "",
          gradeLevel: row.gradeLevel ?? "",
          className: row.className ?? "",
          guardianName: row.guardianName ?? "",
          studentPhone: row.studentPhone ?? "",
        }}
      />
    </div>
  )
}
