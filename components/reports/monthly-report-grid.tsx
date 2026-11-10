"use client"

import * as React from "react"
import { toast } from "sonner"

import {
  saveMonthlyReports,
  type BulkMonthlyReportRow,
} from "@/app/(main)/reports/monthly/actions"
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

type StudentReport = BulkMonthlyReportRow & {
  name: string
  saved: boolean
}

type RubricItem = { id: string; name: string }

export function MonthlyReportGrid({
  classGroup,
  month,
  year,
  students: initialStudents,
  subjects,
  aspects,
  canManage,
}: {
  classGroup: { id: string; name: string }
  month: number
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
  const period = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1))

  function gridRows(
    items: RubricItem[],
    group: "subjectLevels" | "personalSocialLevels"
  ) {
    return students.map((student) => ({
      studentId: student.studentId,
      name: student.name,
      ...Object.fromEntries(
        items.map((item) => [reportGridKey(item.id), student[group][item.id]])
      ),
    }))
  }

  function updateLevels(
    rows: ReportGridRow[],
    items: RubricItem[],
    group: "subjectLevels" | "personalSocialLevels"
  ) {
    const rowsById = new Map(rows.map((row) => [row.studentId, row]))
    setStudents((current) =>
      current.map((student) => {
        const row = rowsById.get(student.studentId)
        return row
          ? {
              ...student,
              [group]: Object.fromEntries(
                items.map((item) => [
                  item.id,
                  row[reportGridKey(item.id)] ?? "",
                ])
              ),
            }
          : student
      })
    )
  }

  const commentRows = students.map((student) => ({
    studentId: student.studentId,
    name: student.name,
    [reportGridKey("comment")]: student.generalComment,
  }))

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
          subjectLevels,
          personalSocialLevels,
          generalComment,
        }) => ({
          studentId,
          subjectLevels,
          personalSocialLevels,
          generalComment,
        })
      )
      const result = await saveMonthlyReports({
        classId: classGroup.id,
        month,
        year,
        reports,
      })
      if (result.error) return void toast.error(result.error)

      const savedById = new Map(
        (result.reports ?? reports).map((report) => [report.studentId, report])
      )
      const saved = students.map((student) => ({
        ...student,
        saved: true,
        subjectLevels:
          savedById.get(student.studentId)?.subjectLevels ??
          student.subjectLevels,
        personalSocialLevels:
          savedById.get(student.studentId)?.personalSocialLevels ??
          student.personalSocialLevels,
        generalComment:
          savedById.get(student.studentId)?.generalComment ??
          student.generalComment,
      }))
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
          {period} · {students.length} students
        </p>
      </div>

      <div
        role="tablist"
        aria-label="Monthly report sections"
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
        <div role="tabpanel">
          <ReportGridCard
            title="Academic Performance"
            description="Select one achievement level for each student and subject."
          >
            <ReportDataGrid
              rows={gridRows(subjects, "subjectLevels")}
              items={subjects}
              onChange={(rows) => updateLevels(rows, subjects, "subjectLevels")}
              canManage={canManage}
              type="level"
            />
          </ReportGridCard>
        </div>
      )}

      {activeTab === "personal" && (
        <div role="tabpanel">
          <ReportGridCard
            title="Personal & Social Development"
            description="Select one development level for each student and aspect."
          >
            <ReportDataGrid
              rows={gridRows(aspects, "personalSocialLevels")}
              items={aspects}
              onChange={(rows) =>
                updateLevels(rows, aspects, "personalSocialLevels")
              }
              canManage={canManage}
              type="level"
            />
          </ReportGridCard>
        </div>
      )}

      {activeTab === "comments" && (
        <Card role="tabpanel">
          <CardHeader className="border-b">
            <CardTitle>General Comments</CardTitle>
            <CardDescription>
              Write an overall progress comment for each student.
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

function ReportGridCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">{children}</CardContent>
    </Card>
  )
}
