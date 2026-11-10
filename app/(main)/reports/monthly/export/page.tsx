import { and, asc, eq, inArray } from "drizzle-orm"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { MonthlyReportDocument } from "@/components/reports/monthly-report-document"
import { PrintButton } from "@/components/reports/print-button"
import { ReportLayoutEditor } from "@/components/reports/report-layout-editor"
import { db } from "@/db"
import {
  assessmentDescriptor,
  classGroup,
  classMember,
  monthlyReport,
  personalSocialRubric,
  schoolProfile,
  student,
  subject,
  teacher,
  user,
} from "@/db/schema"
import { getAcademicPeriodFromDate } from "@/lib/academic-period"
import { createR2DownloadUrl } from "@/lib/r2"

const levels = ["Exceeding", "Meeting", "Developing", "Emerging"] as const

export const metadata: Metadata = {
  title: "Monthly Report Preview",
  description: "Preview and print monthly reports.",
}

export default async function MonthlyReportExportPage({
  searchParams,
}: {
  searchParams: Promise<{
    classId?: string
    month?: string
    year?: string
  }>
}) {
  const query = await searchParams
  const classId = cleanId(query.classId)
  const month = validNumber(query.month, 1, 12)
  const year = validNumber(query.year, 2020, 2100)
  if (!classId || !month || !year) notFound()

  const [classRow] = await db
    .select({
      id: classGroup.id,
      name: classGroup.name,
      cohortYear: classGroup.cohortYear,
      homeroomTeacherId: classGroup.homeroomTeacherId,
    })
    .from(classGroup)
    .where(eq(classGroup.id, classId))
    .limit(1)
  if (!classRow) notFound()

  const { grade } = getAcademicPeriodFromDate(classRow.cohortYear, year, month)

  const [reports, subjects, descriptors, aspects, school] = await Promise.all([
    db
      .select({
        id: monthlyReport.id,
        studentName: student.name,
        subjectLevels: monthlyReport.subjectLevels,
        personalSocialLevels: monthlyReport.personalSocialLevels,
        generalComment: monthlyReport.generalComment,
      })
      .from(monthlyReport)
      .innerJoin(student, eq(student.id, monthlyReport.studentId))
      .innerJoin(classMember, eq(classMember.studentId, student.id))
      .where(
        and(
          eq(monthlyReport.classId, classId),
          eq(monthlyReport.month, month),
          eq(monthlyReport.year, year)
        )
      )
      .orderBy(asc(classMember.position), asc(student.name)),
    db.select().from(subject).orderBy(asc(subject.name)),
    db.select().from(assessmentDescriptor),
    db
      .select()
      .from(personalSocialRubric)
      .orderBy(asc(personalSocialRubric.position)),
    db.query.schoolProfile.findFirst({
      where: eq(schoolProfile.id, "main"),
    }),
  ])

  const signerIds = [
    classRow.homeroomTeacherId,
    school?.principalUserId,
  ].filter((id): id is string => Boolean(id))
  const signers = signerIds.length
    ? await db
        .select({
          id: user.id,
          name: user.name,
          nip: teacher.nip,
          signatureKey: teacher.signatureKey,
        })
        .from(user)
        .leftJoin(teacher, eq(teacher.userId, user.id))
        .where(inArray(user.id, signerIds))
    : []
  const signerMap = new Map(signers.map((row) => [row.id, row]))
  const [logoUrl, foundationLogoUrl, stampUrl] = await Promise.all(
    [school?.logoKey, school?.foundationLogoKey, school?.stampKey].map((key) =>
      key ? createR2DownloadUrl(key, 3600) : null
    )
  )
  const signerWithUrl = async (id: string | null | undefined) => {
    const signer = id ? signerMap.get(id) : null
    if (!signer) return null
    return {
      name: signer.name,
      nip: signer.nip,
      signatureUrl: signer.signatureKey
        ? await createR2DownloadUrl(signer.signatureKey, 3600)
        : null,
    }
  }
  const [homeroomTeacher, principal] = await Promise.all([
    signerWithUrl(classRow.homeroomTeacherId),
    signerWithUrl(school?.principalUserId),
  ])
  const descriptorMap = new Map(
    descriptors.map((row) => [`${row.subjectId}:${row.level}`, row.description])
  )
  const subjectRubrics = subjects.map((row) => ({
    id: row.id,
    name: row.name,
    descriptions: Object.fromEntries(
      levels.map((level) => [
        level,
        descriptorMap.get(`${row.id}:${level}`) ?? "",
      ])
    ) as Record<(typeof levels)[number], string>,
  }))
  const aspectRubrics = aspects.map((row) => ({
    id: row.id,
    name: row.aspect,
    descriptions: {
      Exceeding: row.exceeding,
      Meeting: row.meeting,
      Developing: row.developing,
      Emerging: row.emerging,
    },
  }))
  const address = [
    school?.street,
    school?.village,
    school?.district,
    school?.regency,
    school?.province,
    school?.postalCode,
  ]
    .filter(Boolean)
    .join(", ")
  const period = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1))

  return (
    <div className="monthly-report-export">
      <div className="monthly-report-toolbar">
        <div>
          <h1 className="font-heading text-lg font-medium">
            Monthly Report Export
          </h1>
          <p className="text-xs text-muted-foreground">
            {classRow.name} · Grade {grade} · {period} · {reports.length}{" "}
            students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReportLayoutEditor />
          <PrintButton />
        </div>
      </div>
      {reports.length ? (
        <MonthlyReportDocument
          school={{
            name: school?.name ?? "School",
            address,
            logoUrl,
            foundationLogoUrl,
            stampUrl,
          }}
          classGroup={classRow}
          grade={grade}
          period={period}
          subjects={subjectRubrics}
          aspects={aspectRubrics}
          students={reports.map((report) => ({
            id: report.id,
            name: report.studentName,
            subjectLevels: report.subjectLevels,
            personalSocialLevels: report.personalSocialLevels,
            generalComment: report.generalComment,
          }))}
          homeroomTeacher={homeroomTeacher}
          principal={principal}
        />
      ) : (
        <p className="border p-8 text-center text-sm text-muted-foreground">
          No saved monthly reports for this class and period.
        </p>
      )}
    </div>
  )
}

function cleanId(value: string | undefined) {
  return value && value.length <= 100 ? value : ""
}

function validNumber(
  value: string | undefined,
  minimum: number,
  maximum: number
) {
  const number = Number(value)
  return Number.isInteger(number) && number >= minimum && number <= maximum
    ? number
    : 0
}
