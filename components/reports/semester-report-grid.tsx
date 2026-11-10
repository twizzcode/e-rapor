"use client"

import * as React from "react"
import {
  type Column,
  createTextColumn,
  DataSheetGrid,
  keyColumn,
} from "react-datasheet-grid"
import { toast } from "sonner"

import {
  saveSemesterReports,
  type BulkSemesterReportRow,
} from "@/app/(main)/reports/semester/actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ReportDataGrid,
  type ReportGridRow,
  reportGridKey,
} from "@/components/reports/report-data-grid"

type StudentReport = Omit<BulkSemesterReportRow, "subjectScores"> & {
  name: string
  saved: boolean
  subjectScores: Record<string, number | null>
}

type RubricItem = { id: string; name: string }
type ScoreGridRow = {
  studentId: string
  name: string
  [key: string]: string
}

export function SemesterReportGrid({
  classGroup,
  semester,
  year,
  students: initialStudents,
  subjects,
  aspects,
  canManage,
}: {
  classGroup: { id: string; name: string }
  semester: number
  year: number
  students: StudentReport[]
  subjects: RubricItem[]
  aspects: RubricItem[]
  canManage: boolean
}) {
  const [students, setStudents] = React.useState(initialStudents)
  const [savedSnapshot, setSavedSnapshot] = React.useState(() =>
    JSON.stringify(initialStudents)
  )
  const [pending, startTransition] = React.useTransition()
  const [activeTab, setActiveTab] = React.useState<
    "academic" | "personal" | "comments"
  >("academic")
  const isDirty =
    students.some((student) => !student.saved) ||
    JSON.stringify(students) !== savedSnapshot
  const academicYear = `${year}/${year + 1}`
  const scoreRows = students.map((student) => ({
    studentId: student.studentId,
    name: student.name,
    ...Object.fromEntries(
      subjects.map((subject) => [
        scoreKey(subject.id),
        student.subjectScores[subject.id]?.toString() ?? "",
      ])
    ),
  }))
  const scoreColumns: Column<ScoreGridRow>[] = [
    {
      ...keyColumn<ScoreGridRow, "name">("name", createTextColumn<string>()),
      title: "Student",
      minWidth: 220,
      disabled: true,
    },
    ...subjects.map((subject) => {
      const key = scoreKey(subject.id)
      return {
        ...keyColumn<ScoreGridRow, keyof ScoreGridRow>(
          key,
          createTextColumn<string>({ continuousUpdates: true })
        ),
        title: subject.name,
        minWidth: 120,
        cellClassName: "semester-score-cell",
        disabled: !canManage,
      }
    }),
  ]

  function updateScores(nextRows: ScoreGridRow[]) {
    const invalid = nextRows.some((row) =>
      subjects.some((subject) => {
        const value = (row[scoreKey(subject.id)] ?? "").trim()
        return value !== "" && (!/^\d{1,3}$/.test(value) || Number(value) > 100)
      })
    )
    if (invalid) {
      toast.error("Score must be a whole number from 0 to 100.", {
        id: "invalid-semester-score",
      })
      return
    }

    const nextById = new Map(nextRows.map((row) => [row.studentId, row]))
    setStudents((current) =>
      current.map((student) => {
        const row = nextById.get(student.studentId)
        if (!row) return student
        return {
          ...student,
          subjectScores: Object.fromEntries(
            subjects.map((subject) => {
              const value = (row[scoreKey(subject.id)] ?? "").trim()
              return [subject.id, value === "" ? null : Number(value)]
            })
          ),
        }
      })
    )
  }

  const personalRows = students.map((student) => ({
    studentId: student.studentId,
    name: student.name,
    ...Object.fromEntries(
      aspects.map((aspect) => [
        reportGridKey(aspect.id),
        student.personalSocialLevels[aspect.id],
      ])
    ),
  }))
  const commentRows = students.map((student) => ({
    studentId: student.studentId,
    name: student.name,
    [reportGridKey("comment")]: student.generalComment,
  }))

  function updatePersonal(rows: ReportGridRow[]) {
    const rowsById = new Map(rows.map((row) => [row.studentId, row]))
    setStudents((current) =>
      current.map((student) => {
        const row = rowsById.get(student.studentId)
        return row
          ? {
              ...student,
              personalSocialLevels: Object.fromEntries(
                aspects.map((aspect) => [
                  aspect.id,
                  row[reportGridKey(aspect.id)] ?? "",
                ])
              ),
            }
          : student
      })
    )
  }

  function updateComments(rows: ReportGridRow[]) {
    const rowsById = new Map(rows.map((row) => [row.studentId, row]))
    setStudents((current) =>
      current.map((student) => ({
        ...student,
        generalComment:
          rowsById.get(student.studentId)?.[reportGridKey("comment")] ?? "",
      }))
    )
  }

  function handleSave() {
    startTransition(async () => {
      const reports = students.map(
        ({
          studentId,
          subjectScores,
          personalSocialLevels,
          generalComment,
        }) => ({
          studentId,
          subjectScores,
          personalSocialLevels,
          generalComment,
        })
      )
      const result = await saveSemesterReports({
        classId: classGroup.id,
        semester,
        year,
        reports,
      })
      if (result.error) return void toast.error(result.error)

      const saved = students.map((student) => ({ ...student, saved: true }))
      setStudents(saved)
      setSavedSnapshot(JSON.stringify(saved))
      toast.success(result.success)
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-lg font-medium">{classGroup.name}</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Semester {semester} · Academic Year {academicYear} · {students.length}{" "}
          students
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Semester report sections"
        className="flex w-fit max-w-full overflow-x-auto border bg-muted/40 p-1"
      >
        {[
          ["academic", "Academic Performance"],
          ["personal", "Personal & Social"],
          ["comments", "General Comments"],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={activeTab === value}
            onClick={() =>
              setActiveTab(value as "academic" | "personal" | "comments")
            }
            className="shrink-0 px-4 py-2 text-xs font-medium text-muted-foreground aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-sm"
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "academic" && (
        <Card role="tabpanel">
          <CardHeader className="border-b">
            <CardTitle>Academic Performance</CardTitle>
            <CardDescription>
              Enter scores from 0 to 100. Levels are calculated automatically.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <DataSheetGrid
              className="teacher-grid semester-score-grid"
              value={scoreRows}
              onChange={updateScores}
              columns={scoreColumns}
              rowKey="studentId"
              rowHeight={44}
              headerRowHeight={44}
              gutterColumn={false}
              lockRows
              disableContextMenu
            />
          </CardContent>
        </Card>
      )}

      {activeTab === "personal" && (
        <Card role="tabpanel">
          <CardHeader className="border-b">
            <CardTitle>Personal & Social Development</CardTitle>
            <CardDescription>
              Select one development level for each student and aspect.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <ReportDataGrid
              rows={personalRows}
              items={aspects}
              onChange={updatePersonal}
              canManage={canManage}
              type="level"
            />
          </CardContent>
        </Card>
      )}

      {activeTab === "comments" && (
        <Card role="tabpanel">
          <CardHeader className="border-b">
            <CardTitle>General Comments</CardTitle>
            <CardDescription>
              Write an overall semester progress comment for each student.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-0">
            <ReportDataGrid
              rows={commentRows}
              items={[{ id: "comment", name: "General Comment" }]}
              onChange={updateComments}
              canManage={canManage}
              type="text"
            />
          </CardContent>
        </Card>
      )}

      {students.length === 0 && (
        <p className="border p-6 text-center text-sm text-muted-foreground">
          No students in this class.
        </p>
      )}

      {canManage && students.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={pending || !isDirty}>
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      )}
    </div>
  )
}

function scoreKey(subjectId: string) {
  return `score:${subjectId}`
}
