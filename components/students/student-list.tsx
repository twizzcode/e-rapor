"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  type CellProps,
  type Column,
  createTextColumn,
  DataSheetGrid,
  keyColumn,
} from "react-datasheet-grid"
import { PlusIcon, SearchIcon, Trash2Icon, XIcon } from "lucide-react"
import { toast } from "sonner"

import {
  saveStudents,
  type StudentGridRow,
} from "@/app/(main)/students/actions"
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
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

type SelectData = {
  options: readonly { label: string; value: string }[]
  badge?: boolean
}

const genderOptions = [
  { label: "Male", value: "male" },
  { label: "Female", value: "female" },
]

const numberColumn: Column<StudentGridRow> = {
  component: ({ rowIndex }) => (
    <span className="w-full px-2 text-center text-muted-foreground">
      {rowIndex + 1}
    </span>
  ),
  disabled: true,
  copyValue: ({ rowIndex }) => String(rowIndex + 1),
  pasteValue: ({ rowData }) => rowData,
  deleteValue: ({ rowData }) => rowData,
}

const nameColumn: Column<StudentGridRow> = {
  component: ({ rowData }) => (
    <Link
      href={`/students/${rowData.id}`}
      className="mx-2 truncate font-normal text-foreground underline-offset-4 hover:underline"
    >
      {rowData.name}
    </Link>
  ),
  disabled: true,
  copyValue: ({ rowData }) => rowData.name,
  pasteValue: ({ rowData }) => rowData,
  deleteValue: ({ rowData }) => rowData,
}

function readonlyColumn(
  value: (row: StudentGridRow) => string
): Column<StudentGridRow> {
  return {
    component: ({ rowData }) => (
      <span className="mx-2 truncate">{value(rowData) || "—"}</span>
    ),
    disabled: true,
    copyValue: ({ rowData }) => value(rowData),
    pasteValue: ({ rowData }) => rowData,
    deleteValue: ({ rowData }) => rowData,
  }
}

function SelectCell({
  rowData,
  setRowData,
  focus,
  stopEditing,
  columnData,
}: CellProps<string, SelectData>) {
  const label =
    columnData.options.find((option) => option.value === rowData)?.label ??
    rowData
  if (!focus)
    return (
      <span
        className={cn(
          "mx-2 truncate",
          columnData.badge && "border px-2 py-0.5 font-medium",
          columnData.badge &&
            rowData === "male" &&
            "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300",
          columnData.badge &&
            rowData === "female" &&
            "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-900 dark:bg-pink-950 dark:text-pink-300"
        )}
      >
        {label}
      </span>
    )

  return (
    <select
      autoFocus
      value={rowData}
      className="h-full w-full bg-background px-2 text-xs outline-none"
      onChange={(event) => {
        setRowData(event.target.value)
        stopEditing({ nextRow: false })
      }}
      onBlur={() => stopEditing({ nextRow: false })}
    >
      <option value="">Select</option>
      {columnData.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function selectColumn(columnData: SelectData): Column<string, SelectData> {
  return {
    component: SelectCell,
    columnData,
    disableKeys: true,
    keepFocus: true,
    deleteValue: ({ rowData }) => rowData,
    copyValue: ({ rowData }) =>
      columnData.options.find((option) => option.value === rowData)?.label ??
      rowData,
    pasteValue: ({ rowData, value }) =>
      columnData.options.find(
        (option) => option.label.toLowerCase() === value.trim().toLowerCase()
      )?.value ?? rowData,
  }
}

function BirthDetailsCell({
  rowData,
  setRowData,
  focus,
  stopEditing,
}: CellProps<StudentGridRow>) {
  if (!focus) {
    return (
      <span className="mx-2 truncate">
        {rowData.birthPlace}, {formatBirthDate(rowData.birthDate)}
      </span>
    )
  }

  return (
    <div
      className="flex h-full w-full"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          stopEditing({ nextRow: false })
        }
      }}
    >
      <input
        autoFocus
        value={rowData.birthPlace}
        aria-label="Birth place"
        className="min-w-0 flex-1 border-0 border-r bg-background px-2 text-inherit outline-none"
        onChange={(event) =>
          setRowData({ ...rowData, birthPlace: event.target.value })
        }
      />
      <input
        type="date"
        value={rowData.birthDate}
        aria-label="Birth date"
        className="w-32 border-0 bg-background px-2 text-inherit outline-none"
        onChange={(event) =>
          setRowData({ ...rowData, birthDate: event.target.value })
        }
      />
    </div>
  )
}

const birthDetailsColumn: Column<StudentGridRow> = {
  component: BirthDetailsCell,
  disableKeys: true,
  keepFocus: true,
  copyValue: ({ rowData }) =>
    `${rowData.birthPlace}, ${formatBirthDate(rowData.birthDate)}`,
  pasteValue: ({ rowData }) => rowData,
  deleteValue: ({ rowData }) => rowData,
}

function ActionsCell({
  rowData,
  deleteRow,
  columnData,
}: CellProps<StudentGridRow, { canManage: boolean }>) {
  const [open, setOpen] = React.useState(false)
  if (!columnData.canManage) return null

  return (
    <div className="flex w-full justify-center">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${rowData.name}`}
        title="Delete"
        onClick={() => setOpen(true)}
      >
        <Trash2Icon className="text-destructive" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete student?</AlertDialogTitle>
            <AlertDialogDescription>
              {rowData.name} will be deleted after you save. This also removes
              linked report data and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancelButton>Cancel</AlertDialogCancelButton>
            <AlertDialogActionButton onClick={deleteRow}>
              Delete student
            </AlertDialogActionButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function StudentList({
  students: initialStudents,
  canManage,
}: {
  students: StudentGridRow[]
  canManage: boolean
}) {
  const router = useRouter()
  const [rows, setRows] = React.useState(initialStudents)
  const [savedRows, setSavedRows] = React.useState(initialStudents)
  const [pending, startTransition] = React.useTransition()
  const [leaveOpen, setLeaveOpen] = React.useState(false)
  const [nextUrl, setNextUrl] = React.useState("")
  const [search, setSearch] = React.useState("")
  const [gender, setGender] = React.useState("")
  const [className, setClassName] = React.useState("")
  const dirty = serializeRows(rows) !== serializeRows(savedRows)
  const deletedIds = savedRows
    .filter((saved) => !rows.some((row) => row.id === saved.id))
    .map((row) => row.id)
  const classNames = uniqueValues(rows.map((row) => row.className))
  const normalizedSearch = search.trim().toLocaleLowerCase()
  const filteredRows = rows.filter(
    (row) =>
      (!normalizedSearch ||
        [row.name, row.nis, row.nisn].some((value) =>
          value.toLocaleLowerCase().includes(normalizedSearch)
        )) &&
      (!gender || row.gender === gender) &&
      (!className || row.className === className)
  )
  const filtered = Boolean(search || gender || className)
  const columns: Column<StudentGridRow>[] = [
    { ...numberColumn, title: "No.", minWidth: 52, maxWidth: 52 },
    { ...nameColumn, title: "Full Name", minWidth: 220 },
    {
      ...keyColumn<StudentGridRow, "nis">(
        "nis",
        createTextColumn<string>({ continuousUpdates: true })
      ),
      title: "NIS",
      minWidth: 130,
      disabled: !canManage,
    },
    {
      ...keyColumn<StudentGridRow, "nisn">(
        "nisn",
        createTextColumn<string>({ continuousUpdates: true })
      ),
      title: "NISN",
      minWidth: 150,
      disabled: !canManage,
    },
    {
      ...keyColumn<StudentGridRow, "gender">(
        "gender",
        selectColumn({ options: genderOptions, badge: true })
      ),
      title: "Gender",
      minWidth: 110,
      disabled: !canManage,
    },
    {
      ...birthDetailsColumn,
      title: "Birth Place / Date",
      minWidth: 260,
      disabled: !canManage,
    },
    {
      ...readonlyColumn((row) => row.className ?? ""),
      title: "Class",
      minWidth: 130,
    },
    {
      component: ActionsCell,
      columnData: { canManage },
      title: "Actions",
      minWidth: 64,
      maxWidth: 64,
      disableKeys: true,
      keepFocus: true,
      disabled: !canManage,
      copyValue: () => null,
      pasteValue: ({ rowData }) => rowData,
      deleteValue: ({ rowData }) => rowData,
    },
  ]

  React.useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  React.useEffect(() => {
    if (!dirty || pending) return

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
        link.origin !== window.location.origin
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
  }, [dirty, pending])

  function handleSave() {
    startTransition(async () => {
      const result = await saveStudents(rows, deletedIds)
      if (result.error) return void toast.error(result.error)
      setSavedRows(rows)
      toast.success(result.success)
    })
  }

  function handleGridChange(nextVisibleRows: StudentGridRow[]) {
    const visibleIds = new Set(filteredRows.map((row) => row.id))
    const nextById = new Map(nextVisibleRows.map((row) => [row.id, row]))
    setRows((current) =>
      current.flatMap((row) => {
        if (!visibleIds.has(row.id)) return [row]
        const next = nextById.get(row.id)
        return next ? [next] : []
      })
    )
  }

  function clearFilters() {
    setSearch("")
    setGender("")
    setClassName("")
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Students
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage student identity and enrollment data.
          </p>
        </div>
        {canManage && (
          <Button onClick={handleSave} disabled={pending || !dirty}>
            {pending ? "Saving..." : "Save changes"}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="border-b">
          <CardTitle>Student Data</CardTitle>
          {canManage && (
            <CardAction>
              <Link href="/students/new" className={buttonVariants()}>
                <PlusIcon />
                Add Student
              </Link>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="px-0">
          <div className="grid gap-2 border-b px-4 py-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_160px_180px_auto]">
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, NIS, or NISN"
                aria-label="Search students"
                className="pl-8"
              />
            </div>
            <FilterSelect
              label="Gender"
              value={gender}
              onChange={setGender}
              options={genderOptions}
            />
            <FilterSelect
              label="Class"
              value={className}
              onChange={setClassName}
              options={classNames.map((value) => ({ label: value, value }))}
            />
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={!filtered}
            >
              <XIcon />
              Clear
            </Button>
          </div>
          <DataSheetGrid
            className="teacher-grid"
            value={filteredRows}
            onChange={handleGridChange}
            columns={columns}
            rowKey="id"
            rowHeight={44}
            headerRowHeight={40}
            gutterColumn={false}
            lockRows
            disableContextMenu
            disableExpandSelection
          />
        </CardContent>
      </Card>

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Student changes have not been saved. Leaving this page will
              discard them.
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

function serializeRows(rows: StudentGridRow[]) {
  return JSON.stringify(rows)
}

function uniqueValues(values: (string | null)[]) {
  return [
    ...new Set(values.filter((value): value is string => Boolean(value))),
  ].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: readonly { label: string; value: string }[]
  onChange: (value: string) => void
}) {
  const allValue = "__all__"
  return (
    <Select
      value={value || allValue}
      onValueChange={(nextValue) =>
        onChange(nextValue === allValue ? "" : (nextValue ?? ""))
      }
    >
      <SelectTrigger
        aria-label={`Filter by ${label.toLowerCase()}`}
        className="w-full"
      >
        <SelectValue>
          {value
            ? (options.find((option) => option.value === value)?.label ?? value)
            : `All ${label}`}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={allValue}>All {label}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function formatBirthDate(value: string) {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return value
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)))
}
