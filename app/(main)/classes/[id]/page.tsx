import Link from "next/link"
import { asc, eq, isNull } from "drizzle-orm"
import { notFound } from "next/navigation"
import { PencilIcon } from "lucide-react"
import type { Metadata } from "next"

import { ClassMembers } from "@/components/classes/class-members"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { db } from "@/db"
import { classGroup, classMember, student, user } from "@/db/schema"
import { getSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Class Details",
  description: "View class details and members.",
}

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [{ id }, session] = await Promise.all([
    params,
    getSession(),
  ])

  const [row] = await db
    .select({
      id: classGroup.id,
      name: classGroup.name,
      gradeLevel: classGroup.gradeLevel,
      homeroomTeacher: user.name,
    })
    .from(classGroup)
    .leftJoin(user, eq(user.id, classGroup.homeroomTeacherId))
    .where(eq(classGroup.id, id))
    .limit(1)
  if (!row) notFound()

  const [members, availableStudents] = await Promise.all([
    db
      .select({
        id: student.id,
        name: student.name,
        nis: student.nis,
        nisn: student.nisn,
      })
      .from(classMember)
      .innerJoin(student, eq(student.id, classMember.studentId))
      .where(eq(classMember.classId, id))
      .orderBy(asc(classMember.position), asc(student.name)),
    db
      .select({
        id: student.id,
        name: student.name,
        nis: student.nis,
        nisn: student.nisn,
      })
      .from(student)
      .leftJoin(classMember, eq(classMember.studentId, student.id))
      .where(isNull(classMember.studentId))
      .orderBy(asc(student.name)),
  ])

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {row.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Class details and student membership.
        </p>
      </div>
      <Card>
        <CardHeader className="border-b">
          <CardTitle>{row.name}</CardTitle>
          {session?.user.role === "admin" && (
            <CardAction>
              <Link
                href={`/classes/${id}/edit`}
                className={buttonVariants({ variant: "outline" })}
              >
                <PencilIcon />
                Edit class
              </Link>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          <Detail label="Class name" value={row.name} />
          <Detail label="Grade level" value={`Grade ${row.gradeLevel}`} />
          <Detail label="Homeroom teacher" value={row.homeroomTeacher} />
        </CardContent>
      </Card>
      <ClassMembers
        classId={id}
        className={row.name}
        initialMembers={members}
        initialAvailableStudents={availableStudents}
        canManage={session?.user.role === "admin"}
      />
    </div>
  )
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || "—"}</dd>
    </div>
  )
}
