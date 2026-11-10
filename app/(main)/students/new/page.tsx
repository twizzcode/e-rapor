import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { StudentForm } from "@/components/students/student-form"
import { getSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Add Student",
  description: "Create a new student record.",
}

export default async function NewStudentPage() {
  const session = await getSession()
  if (session?.user.role !== "admin") redirect("/students")

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <StudentForm />
    </div>
  )
}
