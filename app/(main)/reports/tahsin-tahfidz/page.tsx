import { and, asc, eq } from "drizzle-orm"
import type { Metadata } from "next"

import { TahsinTahfidzWorkspace } from "@/components/reports/tahsin-tahfidz-workspace"
import { db } from "@/db"
import {
  classGroup,
  classMember,
  student,
  tahsinTahfidzReport,
  type TahsinTahfidzWeek,
} from "@/db/schema"
import { getSession } from "@/lib/session"
import { getActiveTeacherOptions } from "@/lib/class-options"
import {
  getAcademicPeriodFromDate,
  getSemesterInYear,
} from "@/lib/academic-period"

export const metadata: Metadata = {
  title: "Tahsin Tahfidz Report",
  description: "Input and export Tahsin Tahfidz reports.",
}

export default async function TahsinTahfidzReportPage({
  searchParams,
}: {
  searchParams: Promise<{
    classId?: string
    teacherId?: string
    month?: string
    year?: string
  }>
}) {
  const [params, session, classes, teacherRows] = await Promise.all([
    searchParams,
    getSession(),
    db
      .select({
        id: classGroup.id,
        name: classGroup.name,
        cohortYear: classGroup.cohortYear,
      })
      .from(classGroup)
      .orderBy(asc(classGroup.cohortYear), asc(classGroup.name)),
    getActiveTeacherOptions(),
  ])
  const month = validNumber(params.month, 1, 12, new Date().getMonth() + 1)
  const year = validNumber(params.year, 2020, 2100, new Date().getFullYear())
  const semester = getSemesterInYear(month)
  const selectedClass = classes.find((row) => row.id === params.classId)
  const grade = selectedClass
    ? getAcademicPeriodFromDate(selectedClass.cohortYear, year, month).grade
    : 0
  const teachers = teacherRows.map((row) => ({ id: row.id, name: row.name }))
  const selectedTeacher = teachers.find((row) => row.id === params.teacherId)

  const rows =
    selectedClass && selectedTeacher
      ? await db
          .select({
            studentId: student.id,
            name: student.name,
            reportId: tahsinTahfidzReport.id,
            levelCategory: tahsinTahfidzReport.levelCategory,
            weeks: tahsinTahfidzReport.weeks,
            targetAchievement: tahsinTahfidzReport.targetAchievement,
            overallPerformance: tahsinTahfidzReport.overallPerformance,
            teacherNotes: tahsinTahfidzReport.teacherNotes,
            recommendation: tahsinTahfidzReport.recommendation,
            reportDate: tahsinTahfidzReport.reportDate,
          })
          .from(classMember)
          .innerJoin(student, eq(student.id, classMember.studentId))
          .leftJoin(
            tahsinTahfidzReport,
            and(
              eq(tahsinTahfidzReport.studentId, student.id),
              eq(tahsinTahfidzReport.classId, selectedClass.id),
              eq(tahsinTahfidzReport.teacherId, selectedTeacher.id),
              eq(tahsinTahfidzReport.semester, semester),
              eq(tahsinTahfidzReport.month, month),
              eq(tahsinTahfidzReport.year, year)
            )
          )
          .where(eq(classMember.classId, selectedClass.id))
          .orderBy(asc(classMember.position), asc(student.name))
      : []
  const canManage =
    session?.user.role === "teacher" || session?.user.role === "admin"

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <TahsinTahfidzWorkspace
        key={`${selectedClass?.id}-${selectedTeacher?.id}-${semester}-${month}-${year}`}
        classes={classes}
        teachers={teachers}
        initialClassId={selectedClass?.id ?? ""}
        initialTeacherId={selectedTeacher?.id ?? ""}
        initialSemester={String(semester)}
        initialMonth={String(month)}
        initialYear={String(year)}
        initialGrade={grade}
        initialClassName={selectedClass?.name ?? ""}
        initialStudents={rows.map((row) => ({
          studentId: row.studentId,
          name: row.name,
          saved: Boolean(row.reportId),
          levelCategory: row.levelCategory ?? "Intermediate",
          weeks: normalizeWeeks(row.weeks),
          targetAchievement: row.targetAchievement ?? "",
          overallPerformance: row.overallPerformance ?? "",
          teacherNotes: row.teacherNotes ?? "",
          recommendation: row.recommendation ?? "",
          reportDate: row.reportDate ?? "",
        }))}
        canManage={canManage}
      />
    </div>
  )
}

function normalizeWeeks(weeks: TahsinTahfidzWeek[] | null) {
  return Array.from({ length: 4 }, (_, index) =>
    weeks?.[index] ? { ...weeks[index] } : blankWeek()
  )
}

function blankWeek(): TahsinTahfidzWeek {
  return {
    dateRange: "",
    tahfidzLines: null,
    murojaahPages: null,
    tahsinPages: null,
    grade: "",
  }
}

function validNumber(
  value: string | undefined,
  minimum: number,
  maximum: number,
  fallback: number
) {
  const number = Number(value)
  return Number.isInteger(number) && number >= minimum && number <= maximum
    ? number
    : fallback
}
