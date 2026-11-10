"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  type CellProps,
  type Column,
  createTextColumn,
  DataSheetGrid,
  intColumn,
  keyColumn,
} from "react-datasheet-grid"
import { FileDownIcon } from "lucide-react"
import { toast } from "sonner"

import {
  saveTahsinTahfidzReports,
  type BulkTahsinTahfidzReportRow,
} from "@/app/(main)/reports/tahsin-tahfidz/actions"
import {
  AlertDialog,
  AlertDialogActionButton,
  AlertDialogCancelButton,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { TahsinTahfidzWeek } from "@/db/schema"
import { totalTahfidzLines } from "@/lib/tahsin-tahfidz"

type StudentReport = BulkTahsinTahfidzReportRow & {
  name: string
  saved: boolean
}

type GridRow = {
  studentId: string
  name: string
  levelCategory: string
  dateRange: string
  tahfidzLines: number | null
  murojaahPages: number | null
  tahsinPages: number | null
  grade: string
  targetAchievement: string
  overallPerformance: string
  totalLines: number | null
  reportDate: string
  teacherNotes: string
}

type Option = { id: string; name: string }
type Tab = "summary" | "notes" | `week-${number}`

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

export function TahsinTahfidzWorkspace({
  classes,
  teachers,
  initialClassId,
  initialTeacherId,
  initialSemester,
  initialMonth,
  initialYear,
  initialGrade,
  initialClassName,
  initialStudents,
  canManage,
}: {
  classes: Option[]
  teachers: Option[]
  initialClassId: string
  initialTeacherId: string
  initialSemester: string
  initialMonth: string
  initialYear: string
  initialGrade: number
  initialClassName: string
  initialStudents: StudentReport[]
  canManage: boolean
}) {
  const router = useRouter()
  const [classId, setClassId] = React.useState(initialClassId)
  const [teacherId, setTeacherId] = React.useState(initialTeacherId)
  const [month, setMonth] = React.useState(initialMonth)
  const [year, setYear] = React.useState(initialYear)
  const [students, setStudents] = React.useState(initialStudents)
  const [savedSnapshot, setSavedSnapshot] = React.useState(() =>
    JSON.stringify(initialStudents)
  )
  const [activeTab, setActiveTab] = React.useState<Tab>("week-1")
  const [pending, startTransition] = React.useTransition()
  const [leaveOpen, setLeaveOpen] = React.useState(false)
  const [nextUrl, setNextUrl] = React.useState("")
  const isDirty = JSON.stringify(students) !== savedSnapshot

  React.useEffect(() => {
    if (!isDirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [isDirty])

  React.useEffect(() => {
    if (!isDirty || pending) return
    function interceptNavigation(event: MouseEvent) {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }
      const link = (event.target as Element).closest(
        "a[href]"
      ) as HTMLAnchorElement | null
      if (
        !link ||
        link.target === "_blank" ||
        link.origin !== location.origin
      ) {
        return
      }
      const destination = `${link.pathname}${link.search}${link.hash}`
      if (
        destination === `${location.pathname}${location.search}${location.hash}`
      ) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      setNextUrl(destination)
      setLeaveOpen(true)
    }
    document.addEventListener("click", interceptNavigation, true)
    return () =>
      document.removeEventListener("click", interceptNavigation, true)
  }, [isDirty, pending])

  function setupUrl(exportReport = false) {
    const params = new URLSearchParams({
      classId,
      teacherId,
      month,
      year,
    })
    return exportReport
      ? `/reports/tahsin-tahfidz/export?${params}`
      : `/reports/tahsin-tahfidz?${params}`
  }

  function requestNavigation(url: string) {
    if (isDirty) {
      setNextUrl(url)
      setLeaveOpen(true)
    } else {
      router.push(url)
    }
  }

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (classId && teacherId) requestNavigation(setupUrl())
  }

  function updateWeek(weekIndex: number, rows: GridRow[]) {
    const rowsById = new Map(rows.map((row) => [row.studentId, row]))
    setStudents((current) =>
      current.map((student) => {
        const row = rowsById.get(student.studentId)
        if (!row) return student
        const weeks = [...student.weeks]
        weeks[weekIndex] = {
          dateRange: row.dateRange,
          tahfidzLines: row.tahfidzLines,
          murojaahPages: row.murojaahPages,
          tahsinPages: row.tahsinPages,
          grade: row.grade as TahsinTahfidzWeek["grade"],
        }
        return { ...student, weeks }
      })
    )
  }

  function updateSummary(rows: GridRow[]) {
    const rowsById = new Map(rows.map((row) => [row.studentId, row]))
    setStudents((current) =>
      current.map((student) => {
        const row = rowsById.get(student.studentId)
        return row
          ? {
              ...student,
              levelCategory: row.levelCategory,
              targetAchievement: row.targetAchievement,
              overallPerformance: row.overallPerformance,
              reportDate: row.reportDate,
            }
          : student
      })
    )
  }

  function updateNotes(rows: GridRow[]) {
    const rowsById = new Map(rows.map((row) => [row.studentId, row]))
    setStudents((current) =>
      current.map((student) => ({
        ...student,
        teacherNotes:
          rowsById.get(student.studentId)?.teacherNotes.slice(0, 1200) ??
          student.teacherNotes,
      }))
    )
  }

  function handleSave() {
    startTransition(async () => {
      const reports = students.map((student) => ({
        studentId: student.studentId,
        levelCategory: student.levelCategory,
        weeks: student.weeks,
        targetAchievement: student.targetAchievement,
        overallPerformance: student.overallPerformance,
        teacherNotes: student.teacherNotes,
        reportDate: student.reportDate,
      }))
      const result = await saveTahsinTahfidzReports({
        classId: initialClassId,
        teacherId: initialTeacherId,
        semester: Number(initialSemester),
        month: Number(initialMonth),
        year: Number(initialYear),
        reports,
      })
      if (result.error) return void toast.error(result.error)
      const saved = students.map((student) => ({ ...student, saved: true }))
      setStudents(saved)
      setSavedSnapshot(JSON.stringify(saved))
      toast.success(result.success)
    })
  }

  const weekIndex = activeTab.startsWith("week-")
    ? Number(activeTab.slice(5)) - 1
    : -1
  const weekRows = weekIndex >= 0 ? toWeekRows(students, weekIndex) : []
  const period = `${months[Number(initialMonth) - 1]} ${initialYear}`

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Tahsin Tahfidz Report
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Input weekly Tahsin and Tahfidz progress, then export one A4 page
            per student.
          </p>
        </div>
        {canManage &&
          initialClassId &&
          initialTeacherId &&
          students.length > 0 && (
            <Button onClick={handleSave} disabled={pending || !isDirty}>
              {pending ? "Saving..." : "Save changes"}
            </Button>
          )}
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Report Setup</CardTitle>
          <CardDescription>
            Choose class, month, year, and Tahfidz teacher. Grade and semester
            are calculated from the class cohort and report month.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={applyFilters}>
            <FieldGroup className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <SetupSelect label="Class" value={classId} onChange={setClassId}>
                {classes.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SetupSelect>
              <SetupSelect label="Month" value={month} onChange={setMonth}>
                {months.map((name, index) => (
                  <SelectItem key={name} value={String(index + 1)}>
                    {name}
                  </SelectItem>
                ))}
              </SetupSelect>
              <SetupSelect label="Year" value={year} onChange={setYear}>
                {[2025, 2026, 2027, 2028].map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SetupSelect>
              <SetupSelect
                label="Tahfidz Teacher"
                value={teacherId}
                onChange={setTeacherId}
              >
                {teachers.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))}
              </SetupSelect>
              <div className="flex gap-2 sm:col-span-2 xl:col-span-4">
                <Button type="submit" disabled={!classId || !teacherId}>
                  Show input table
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!classId || !teacherId}
                  onClick={() => requestNavigation(setupUrl(true))}
                >
                  <FileDownIcon />
                  Export report
                </Button>
              </div>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {initialClassId && initialTeacherId && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-heading text-lg font-medium">
              {initialClassName}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Grade {initialGrade || "—"} · {period} · Semester{" "}
              {initialSemester} · {students.length} students
            </p>
          </div>
          <div
            role="tablist"
            aria-label="Tahsin Tahfidz report sections"
            className="flex w-fit max-w-full overflow-x-auto border bg-muted/40 p-1"
          >
            {[1, 2, 3, 4].map((week) => (
              <TabButton
                key={week}
                active={activeTab === `week-${week}`}
                onClick={() => setActiveTab(`week-${week}`)}
              >
                Week {week}
              </TabButton>
            ))}
            <TabButton
              active={activeTab === "summary"}
              onClick={() => setActiveTab("summary")}
            >
              Summary
            </TabButton>
            <TabButton
              active={activeTab === "notes"}
              onClick={() => setActiveTab("notes")}
            >
              Teacher Notes
            </TabButton>
          </div>

          {weekIndex >= 0 && (
            <GridCard
              title={`Week ${weekIndex + 1} Achievement`}
              description="Enter date range, Tahfidz lines, Murojaah pages, Tahsin pages, and grade."
            >
              <TahsinGrid
                rows={weekRows}
                columns={weekColumns(canManage)}
                onChange={(rows) => updateWeek(weekIndex, rows)}
              />
            </GridCard>
          )}
          {activeTab === "summary" && (
            <GridCard
              title="Four-Week Summary"
              description="Select level, target achievement, overall performance, and report date."
            >
              <TahsinGrid
                rows={toSummaryRows(students)}
                columns={summaryColumns(canManage)}
                onChange={updateSummary}
              />
            </GridCard>
          )}
          {activeTab === "notes" && (
            <GridCard
              title="Teacher Notes"
              description="Write Tahsin and Tahfidz progress notes for each student (maximum 1,200 characters)."
            >
              <TahsinGrid
                rows={toNotesRows(students)}
                columns={notesColumns(canManage)}
                onChange={updateNotes}
                rowHeight={68}
              />
            </GridCard>
          )}
          {students.length === 0 && (
            <p className="border p-6 text-center text-sm text-muted-foreground">
              No students in this class.
            </p>
          )}
        </div>
      )}

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Tahsin Tahfidz changes have not been saved. Leaving this setup
              will discard them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancelButton>Stay on page</AlertDialogCancelButton>
            <AlertDialogActionButton onClick={() => router.push(nextUrl)}>
              Discard and leave
            </AlertDialogActionButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function SetupSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
}) {
  const id = React.useId()
  return (
    <Field>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Select
        value={value || null}
        onValueChange={(next) => next && onChange(next)}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    </Field>
  )
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="shrink-0 px-4 py-2 text-xs font-medium text-muted-foreground aria-selected:bg-background aria-selected:text-foreground aria-selected:shadow-sm"
    >
      {children}
    </button>
  )
}

function GridCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <Card role="tabpanel">
      <CardHeader className="border-b">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-0">{children}</CardContent>
    </Card>
  )
}

function TahsinGrid({
  rows,
  columns,
  onChange,
  rowHeight = 44,
}: {
  rows: GridRow[]
  columns: Column<GridRow>[]
  onChange: (rows: GridRow[]) => void
  rowHeight?: number
}) {
  return (
    <DataSheetGrid
      className="teacher-grid report-input-grid"
      value={rows}
      onChange={onChange}
      columns={columns}
      rowKey="studentId"
      rowHeight={rowHeight}
      headerRowHeight={44}
      gutterColumn={false}
      lockRows
      disableContextMenu
    />
  )
}

function studentColumn(): Column<GridRow> {
  return {
    ...keyColumn<GridRow, "name">("name", createTextColumn<string>()),
    title: "Student",
    minWidth: 220,
    disabled: true,
  }
}

function weekColumns(canManage: boolean): Column<GridRow>[] {
  return [
    studentColumn(),
    textColumn("dateRange", "Date Range", 180, canManage),
    numberColumn("tahfidzLines", "Tahfidz Total Lines", canManage),
    numberColumn("murojaahPages", "Murojaah (Page)", canManage),
    numberColumn("tahsinPages", "Tahsin (Page)", canManage),
    selectKeyColumn("grade", "Grade", ["A", "B", "PB"], canManage, 110),
  ]
}

function summaryColumns(canManage: boolean): Column<GridRow>[] {
  return [
    studentColumn(),
    selectKeyColumn(
      "levelCategory",
      "Level Category",
      ["Advanced", "Intermediate", "Basic"],
      canManage,
      170
    ),
    {
      ...keyColumn<GridRow, "totalLines">("totalLines", intColumn),
      title: "Total Lines Memorized",
      minWidth: 180,
      disabled: true,
    },
    selectKeyColumn(
      "targetAchievement",
      "Target Achievement",
      ["Meets Target", "Above Target", "Below Target"],
      canManage,
      190
    ),
    selectKeyColumn(
      "overallPerformance",
      "Overall Performance",
      ["A", "B", "PB"],
      canManage,
      180
    ),
    textColumn("reportDate", "Report Date (YYYY-MM-DD)", 200, canManage),
  ]
}

function notesColumns(canManage: boolean): Column<GridRow>[] {
  return [
    studentColumn(),
    textColumn("teacherNotes", "Teacher Notes", 800, canManage),
  ]
}

function textColumn(
  key: "dateRange" | "reportDate" | "teacherNotes",
  title: string,
  minWidth: number,
  canManage: boolean
): Column<GridRow> {
  return {
    ...keyColumn<GridRow, typeof key>(
      key,
      createTextColumn<string>({ continuousUpdates: true })
    ),
    title,
    minWidth,
    disabled: !canManage,
  }
}

function numberColumn(
  key: "tahfidzLines" | "murojaahPages" | "tahsinPages",
  title: string,
  canManage: boolean
): Column<GridRow> {
  return {
    ...keyColumn<GridRow, typeof key>(key, intColumn),
    title,
    minWidth: 155,
    disabled: !canManage,
  }
}

function selectKeyColumn(
  key: "grade" | "levelCategory" | "targetAchievement" | "overallPerformance",
  title: string,
  options: string[],
  canManage: boolean,
  minWidth: number
): Column<GridRow> {
  return {
    ...keyColumn<GridRow, typeof key>(key, {
      component: SelectCell,
      columnData: options,
      disableKeys: true,
      keepFocus: true,
      deleteValue: () => "",
      copyValue: ({ rowData }) => rowData ?? "",
      pasteValue: ({ rowData, value }) =>
        options.find(
          (option) => option.toLowerCase() === value.trim().toLowerCase()
        ) ?? rowData,
    }),
    title,
    minWidth,
    disabled: !canManage,
  }
}

function SelectCell({
  rowData,
  setRowData,
  columnData,
  focus,
  stopEditing,
}: CellProps<string, string[]>) {
  if (!focus) return <span className="mx-2 truncate">{rowData}</span>
  return (
    <select
      autoFocus
      value={rowData ?? ""}
      className="h-full w-full bg-background px-2 text-xs outline-none"
      onChange={(event) => {
        setRowData(event.target.value)
        stopEditing({ nextRow: false })
      }}
      onBlur={() => stopEditing({ nextRow: false })}
    >
      <option value="">Select</option>
      {columnData.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

function blankGridRow(student: StudentReport): GridRow {
  return {
    studentId: student.studentId,
    name: student.name,
    levelCategory: "",
    dateRange: "",
    tahfidzLines: null,
    murojaahPages: null,
    tahsinPages: null,
    grade: "",
    targetAchievement: "",
    overallPerformance: "",
    totalLines: null,
    reportDate: "",
    teacherNotes: "",
  }
}

function toWeekRows(students: StudentReport[], weekIndex: number) {
  return students.map((student) => ({
    ...blankGridRow(student),
    ...student.weeks[weekIndex],
  }))
}

function toSummaryRows(students: StudentReport[]) {
  return students.map((student) => ({
    ...blankGridRow(student),
    levelCategory: student.levelCategory,
    totalLines: totalTahfidzLines(student.weeks),
    targetAchievement: student.targetAchievement,
    overallPerformance: student.overallPerformance,
    reportDate: student.reportDate,
  }))
}

function toNotesRows(students: StudentReport[]) {
  return students.map((student) => ({
    ...blankGridRow(student),
    teacherNotes: student.teacherNotes,
  }))
}
