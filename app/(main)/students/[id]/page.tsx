import Link from "next/link"
import { eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import { PencilIcon } from "lucide-react"
import type { Metadata } from "next"

import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { db } from "@/db"
import { classGroup, classMember, student } from "@/db/schema"
import { getSession } from "@/lib/session"

export const metadata: Metadata = {
  title: "Student Details",
  description: "View student identity and enrollment details.",
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [{ id }, session] = await Promise.all([params, getSession()])
  const [row, membership] = await Promise.all([
    db.query.student.findFirst({ where: eq(student.id, id) }),
    db
      .select({ className: classGroup.name })
      .from(classMember)
      .innerJoin(classGroup, eq(classGroup.id, classMember.classId))
      .where(eq(classMember.studentId, id))
      .limit(1),
  ])
  if (!row) notFound()

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {row.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Student identity and enrollment details.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Student Details</CardTitle>
          {session?.user.role === "admin" && (
            <CardAction>
              <Link
                href={`/students/${id}/edit`}
                className={buttonVariants({ variant: "outline" })}
              >
                <PencilIcon />
                Edit student
              </Link>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <Detail label="NISN" value={row.nisn} />
          <Detail label="NIS" value={row.nis} />
          <Detail label="Admission date" value={row.admissionDate} />
          <Detail
            label="Birth place / date"
            value={[row.birthPlace, row.birthDate].filter(Boolean).join(", ")}
          />
          <Detail
            label="Gender"
            value={
              row.gender === "male"
                ? "Male"
                : row.gender === "female"
                  ? "Female"
                  : null
            }
          />
          <Detail label="Religion" value={formatValue(row.religion)} />
          <Detail
            label="Address"
            value={[
              row.street,
              row.village,
              row.district,
              row.regency,
              row.province,
              row.postalCode,
            ]
              .filter(Boolean)
              .join(", ")}
          />
          <Detail label="Family status" value={formatValue(row.familyStatus)} />
          <Detail label="Child order" value={row.childOrder?.toString()} />
          <Detail label="Previous school" value={row.previousSchool} />
          <Detail label="Admitted to class" value={row.admittedClass} />
          <Detail label="Class" value={membership[0]?.className} />
          <Detail label="Guardian name" value={row.guardianName} />
          <Detail label="Student phone number" value={row.studentPhone} />
        </CardContent>
      </Card>
    </div>
  )
}

function formatValue(value: string | null) {
  if (!value) return null
  return value
    .split("-")
    .map((word) => word[0]?.toUpperCase() + word.slice(1))
    .join(" ")
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value || "—"}</dd>
    </div>
  )
}
