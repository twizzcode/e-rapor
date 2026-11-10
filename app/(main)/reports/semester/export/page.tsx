import { and, asc, eq, inArray } from "drizzle-orm"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

import { ReportExportMenu } from "@/components/reports/report-export-menu"
import { ReportLayoutEditor } from "@/components/reports/report-layout-editor"
import { SemesterReportDocument } from "@/components/reports/semester-report-document"
import { db } from "@/db"
import {
  assessmentDescriptor,
  classGroup,
  classMember,
  personalSocialRubric,
  schoolProfile,
  semesterReport,
  student,
  subject,
  teacher,
  user,
} from "@/db/schema"
import {
  formatAcademicYear,
  getAcademicPeriodFromSemesterNumber,
  MAX_SEMESTER,
} from "@/lib/academic-period"
import { createR2DataUrl } from "@/lib/r2"

const levels = ["Exceeding", "Meeting", "Developing", "Emerging"] as const

export const metadata: Metadata = {
  title: "Semester Report Preview",
  description: "Preview and print semester reports.",
}

export default async function SemesterReportExportPage({
  searchParams,
}: {
  searchParams: Promise<{
    classId?: string
    semester?: string
  }>
}) {
  const query = await searchParams
  const classId = cleanId(query.classId)
  const semesterNumber = validNumber(query.semester, 1, MAX_SEMESTER)
  if (!classId || !semesterNumber) notFound()

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

  const period = getAcademicPeriodFromSemesterNumber(
    classRow.cohortYear,
    semesterNumber
  )
  const semester = period.semesterInYear
  const year = period.academicYearStart

  const [reports, subjects, descriptors, aspects, school] = await Promise.all([
    db
      .select({
        id: semesterReport.id,
        studentName: student.name,
        subjectScores: semesterReport.subjectScores,
        personalSocialLevels: semesterReport.personalSocialLevels,
        generalComment: semesterReport.generalComment,
      })
      .from(semesterReport)
      .innerJoin(student, eq(student.id, semesterReport.studentId))
      .innerJoin(classMember, eq(classMember.studentId, student.id))
      .where(
        and(
          eq(semesterReport.classId, classId),
          eq(semesterReport.semester, semester),
          eq(semesterReport.year, year)
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
      key ? createR2DataUrl(key) : null
    )
  )
  const signerWithUrl = async (id: string | null | undefined) => {
    const signer = id ? signerMap.get(id) : null
    if (!signer) return null
    return {
      name: signer.name,
      nip: signer.nip,
      signatureUrl: signer.signatureKey
        ? await createR2DataUrl(signer.signatureKey)
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
  const academicYear = formatAcademicYear(year)
  const periodLabel = `Semester ${semesterNumber} ${academicYear}`

  return (
    <div className="monthly-report-export">
      <div className="monthly-report-toolbar">
        <div>
          <h1 className="font-heading text-lg font-medium">
            Semester Report Export
          </h1>
          <p className="text-xs text-muted-foreground">
            {classRow.name} · Grade {period.grade} · Semester {semesterNumber} ·{" "}
            {academicYear} · {reports.length} students
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ReportLayoutEditor />
          <ReportExportMenu
            pageSelector=".semester-report-page"
            periodLabel={periodLabel}
            grade={period.grade}
            disabled={!reports.length}
          />
        </div>
      </div>
      {reports.length ? (
        <SemesterReportDocument
          school={{
            name: school?.name ?? "School",
            address,
            logoUrl,
            foundationLogoUrl,
            stampUrl,
          }}
          grade={period.grade}
          academicYear={academicYear}
          semester={semester}
          subjects={subjectRubrics}
          aspects={aspectRubrics}
          students={reports.map((report) => ({
            id: report.id,
            name: report.studentName,
            subjectScores: report.subjectScores,
            personalSocialLevels: report.personalSocialLevels,
            generalComment: report.generalComment,
          }))}
          homeroomTeacher={homeroomTeacher}
          principal={principal}
        />
      ) : (
        <p className="border p-8 text-center text-sm text-muted-foreground">
          No saved semester reports for this class and period.
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
