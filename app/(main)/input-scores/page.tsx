import { and, asc, eq } from "drizzle-orm"
import type { Metadata } from "next"

import { MonthlyReportGrid } from "@/components/reports/monthly-report-grid"
import { ReportFilters } from "@/components/reports/report-filters"
import { SemesterReportGrid } from "@/components/reports/semester-report-grid"
import { db } from "@/db"
import {
  classGroup,
  classMember,
  monthlyReport,
  personalSocialRubric,
  semesterReport,
  student,
  subject,
} from "@/db/schema"
import {
  getAcademicPeriodFromDate,
  getAcademicPeriodFromSemesterNumber,
  MAX_SEMESTER,
} from "@/lib/academic-period"
import { getSession } from "@/lib/session"

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ reportType?: string }>
}): Promise<Metadata> {
  const reportType = (await searchParams).reportType
  const semester = reportType === "semester"
  return {
    title: semester ? "Semester Report" : "Monthly Report",
    description: semester
      ? "Input and export semester reports."
      : "Input and export monthly reports.",
  }
}

export default async function InputScoresPage({
  searchParams,
}: {
  searchParams: Promise<{
    reportType?: string
    classId?: string
    semester?: string
    month?: string
    year?: string
  }>
}) {
  const [params, session] = await Promise.all([searchParams, getSession()])
  const reportType = params.reportType === "semester" ? "semester" : "monthly"
  const month = validNumber(params.month, 1, 12, new Date().getMonth() + 1)
  const year = validNumber(params.year, 2020, 2100, new Date().getFullYear())
  const semesterNumber =
    reportType === "semester"
      ? validNumber(params.semester, 1, MAX_SEMESTER, 1)
      : 0
  const classes = await db
    .select({
      id: classGroup.id,
      name: classGroup.name,
      cohortYear: classGroup.cohortYear,
    })
    .from(classGroup)
    .orderBy(asc(classGroup.cohortYear), asc(classGroup.name))
  const selectedClass = classes.find((row) => row.id === params.classId)

  const [subjects, aspects] = selectedClass
    ? await Promise.all([
        db
          .select({ id: subject.id, name: subject.name })
          .from(subject)
          .orderBy(asc(subject.name)),
        db
          .select({
            id: personalSocialRubric.id,
            name: personalSocialRubric.aspect,
          })
          .from(personalSocialRubric)
          .orderBy(asc(personalSocialRubric.position)),
      ])
    : [[], []]
  const canManage =
    session?.user.role === "teacher" || session?.user.role === "admin"

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          {reportType === "monthly" ? "Monthly Report" : "Semester Report"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {reportType === "monthly"
            ? "Input and export monthly reports for an entire class."
            : "Input and export semester reports for an entire class."}
        </p>
      </div>
      <ReportFilters
        classes={classes}
        initialReportType={reportType}
        initialClassId={selectedClass?.id ?? ""}
        initialSemester={String(semesterNumber)}
        initialMonth={String(month)}
        initialYear={String(year)}
      />
      {selectedClass && reportType === "monthly" && (
        <MonthlyReports
          classGroup={selectedClass}
          month={month}
          year={year}
          subjects={subjects}
          aspects={aspects}
          canManage={canManage}
        />
      )}
      {selectedClass && reportType === "semester" && (
        <SemesterReports
          classGroup={selectedClass}
          semesterNumber={semesterNumber}
          subjects={subjects}
          aspects={aspects}
          canManage={canManage}
        />
      )}
    </div>
  )
}

async function MonthlyReports({
  classGroup: selectedClass,
  month,
  year,
  subjects,
  aspects,
  canManage,
}: ReportGridProps & { month: number; year: number }) {
  const { grade } = getAcademicPeriodFromDate(
    selectedClass.cohortYear,
    year,
    month
  )
  const rows = await db
    .select({
      id: student.id,
      name: student.name,
      reportId: monthlyReport.id,
      subjectLevels: monthlyReport.subjectLevels,
      personalSocialLevels: monthlyReport.personalSocialLevels,
      generalComment: monthlyReport.generalComment,
    })
    .from(classMember)
    .innerJoin(student, eq(student.id, classMember.studentId))
    .leftJoin(
      monthlyReport,
      and(
        eq(monthlyReport.studentId, student.id),
        eq(monthlyReport.year, year),
        eq(monthlyReport.month, month)
      )
    )
    .where(eq(classMember.classId, selectedClass.id))
    .orderBy(asc(classMember.position), asc(student.name))

  return (
    <MonthlyReportGrid
      key={`${selectedClass.id}-${month}-${year}`}
      classGroup={selectedClass}
      grade={grade}
      month={month}
      year={year}
      students={rows.map((row) => ({
        studentId: row.id,
        name: row.name,
        saved: Boolean(row.reportId),
        subjectLevels: Object.fromEntries(
          subjects.map((subject) => [
            subject.id,
            row.subjectLevels?.[subject.id] ?? "Exceeding",
          ])
        ),
        personalSocialLevels: Object.fromEntries(
          aspects.map((aspect) => [
            aspect.id,
            row.personalSocialLevels?.[aspect.id] ?? "Exceeding",
          ])
        ),
        generalComment: row.generalComment ?? "",
      }))}
      subjects={subjects}
      aspects={aspects}
      canManage={canManage}
    />
  )
}

async function SemesterReports({
  classGroup: selectedClass,
  semesterNumber,
  subjects,
  aspects,
  canManage,
}: ReportGridProps & { semesterNumber: number }) {
  const period = getAcademicPeriodFromSemesterNumber(
    selectedClass.cohortYear,
    semesterNumber
  )
  const rows = await db
    .select({
      id: student.id,
      name: student.name,
      reportId: semesterReport.id,
      subjectScores: semesterReport.subjectScores,
      personalSocialLevels: semesterReport.personalSocialLevels,
      generalComment: semesterReport.generalComment,
    })
    .from(classMember)
    .innerJoin(student, eq(student.id, classMember.studentId))
    .leftJoin(
      semesterReport,
      and(
        eq(semesterReport.studentId, student.id),
        eq(semesterReport.semester, period.semesterInYear),
        eq(semesterReport.year, period.academicYearStart)
      )
    )
    .where(eq(classMember.classId, selectedClass.id))
    .orderBy(asc(classMember.position), asc(student.name))

  return (
    <SemesterReportGrid
      key={`${selectedClass.id}-${semesterNumber}`}
      classGroup={selectedClass}
      semester={period.semesterInYear}
      year={period.academicYearStart}
      semesterNumber={semesterNumber}
      grade={period.grade}
      students={rows.map((row) => ({
        studentId: row.id,
        name: row.name,
        saved: Boolean(row.reportId),
        subjectScores: Object.fromEntries(
          subjects.map((subject) => [
            subject.id,
            row.subjectScores?.[subject.id] ?? null,
          ])
        ),
        personalSocialLevels: Object.fromEntries(
          aspects.map((aspect) => [
            aspect.id,
            row.personalSocialLevels?.[aspect.id] ?? "Exceeding",
          ])
        ),
        generalComment: row.generalComment ?? "",
      }))}
      subjects={subjects}
      aspects={aspects}
      canManage={canManage}
    />
  )
}

type ReportGridProps = {
  classGroup: { id: string; name: string; cohortYear: number }
  subjects: { id: string; name: string }[]
  aspects: { id: string; name: string }[]
  canManage: boolean
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
