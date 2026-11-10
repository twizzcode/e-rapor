import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { ClassForm } from "@/components/classes/class-form"
import { getSession } from "@/lib/session"
import { getActiveTeacherOptions } from "@/lib/class-options"

export const metadata: Metadata = {
  title: "Add Class",
  description: "Create a new class.",
}

export default async function NewClassPage() {
  const [session, teachers] = await Promise.all([
    getSession(),
    getActiveTeacherOptions(),
  ])
  if (session?.user.role !== "admin") redirect("/classes")

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Add Class
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create a class and assign its homeroom teacher.
        </p>
      </div>
      <ClassForm teachers={teachers} />
    </div>
  )
}
