import { and, asc, eq } from "drizzle-orm"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { ReportExportMenu } from "@/components/reports/report-export-menu"
import { ReportLayoutEditor } from "@/components/reports/report-layout-editor"
import { TahsinTahfidzReportDocument } from "@/components/reports/tahsin-tahfidz-report-document"
import { db } from "@/db"
import {
  classGroup,
  classMember,
  student,
  tahsinTahfidzReport,
  teacher,
  user,
} from "@/db/schema"
import {
  getAcademicPeriodFromDate,
  getSemesterInYear,
} from "@/lib/academic-period"
import { createR2DataUrl } from "@/lib/r2"

export const metadata: Metadata = {
  title: "Tahsin Tahfidz Report Preview",
  description: "Preview and print Tahsin Tahfidz reports.",
}

export default async function TahsinTahfidzExportPage({
  searchParams,
}: {
  searchParams: Promise<{
    classId?: string
    teacherId?: string
    month?: string
    year?: string
  }>
}) {
  const query = await searchParams
  const classId = cleanId(query.classId)
  const teacherId = cleanId(query.teacherId)
  const month = validNumber(query.month, 1, 12)
  const year = validNumber(query.year, 2020, 2100)
  if (!classId || !teacherId || !month || !year) notFound()
  const semester = getSemesterInYear(month)

  const [classRow, teacherRow, reports] = await Promise.all([
    db
      .select({
        id: classGroup.id,
        name: classGroup.name,
        cohortYear: classGroup.cohortYear,
      })
      .from(classGroup)
      .where(eq(classGroup.id, classId))
      .limit(1),
    db
      .select({
        id: user.id,
        name: user.name,
        nip: teacher.nip,
        signatureKey: teacher.signatureKey,
      })
      .from(user)
      .leftJoin(teacher, eq(teacher.userId, user.id))
      .where(eq(user.id, teacherId))
      .limit(1),
    db
      .select({
        id: tahsinTahfidzReport.id,
        studentName: student.name,
        levelCategory: tahsinTahfidzReport.levelCategory,
        weeks: tahsinTahfidzReport.weeks,
        targetAchievement: tahsinTahfidzReport.targetAchievement,
        overallPerformance: tahsinTahfidzReport.overallPerformance,
        teacherNotes: tahsinTahfidzReport.teacherNotes,
        recommendation: tahsinTahfidzReport.recommendation,
        reportDate: tahsinTahfidzReport.reportDate,
      })
      .from(tahsinTahfidzReport)
      .innerJoin(student, eq(student.id, tahsinTahfidzReport.studentId))
      .innerJoin(classMember, eq(classMember.studentId, student.id))
      .where(
        and(
          eq(tahsinTahfidzReport.classId, classId),
          eq(tahsinTahfidzReport.teacherId, teacherId),
          eq(tahsinTahfidzReport.semester, semester),
          eq(tahsinTahfidzReport.month, month),
          eq(tahsinTahfidzReport.year, year)
        )
      )
      .orderBy(asc(classMember.position), asc(student.name)),
  ])
  if (!classRow[0] || !teacherRow[0]) notFound()

  const grade = getAcademicPeriodFromDate(
    classRow[0].cohortYear,
    year,
    month
  ).grade
  const tahfidzTeacher = teacherRow[0]
  const signatureUrl = tahfidzTeacher.signatureKey
    ? await createR2DataUrl(tahfidzTeacher.signatureKey)
    : null
  const period = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1))
  const periodLabel = `Tahsin Tahfidz ${period}`

  return (
    <div className="monthly-report-export tahsin-report-export">
      <div className="monthly-report-toolbar">
        <div>
          <h1 className="font-heading text-lg font-medium">
            Tahsin Tahfidz Report Export
          </h1>
          <p className="text-xs text-muted-foreground">
            {classRow[0].name} · Grade {grade} · {period} · Semester {semester}{" "}
            · {reports.length} students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReportLayoutEditor mode="tahsin" />
          <ReportExportMenu
            pageSelector=".tahsin-report-page"
            periodLabel={periodLabel}
            grade={grade}
            disabled={!reports.length}
          />
        </div>
      </div>
      {reports.length ? (
        <TahsinTahfidzReportDocument
          classGroup={classRow[0]}
          grade={grade}
          teacher={{
            name: tahfidzTeacher.name,
            nip: tahfidzTeacher.nip,
            signatureUrl,
          }}
          semester={semester}
          month={month}
          year={year}
          students={reports.map((report) => ({
            id: report.id,
            name: report.studentName,
            levelCategory: report.levelCategory,
            weeks: report.weeks,
            targetAchievement: report.targetAchievement,
            overallPerformance: report.overallPerformance,
            teacherNotes: report.teacherNotes,
            recommendation: report.recommendation,
            reportDate: report.reportDate,
          }))}
        />
      ) : (
        <p className="border p-8 text-center text-sm text-muted-foreground">
          No saved Tahsin Tahfidz reports for this setup.
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
