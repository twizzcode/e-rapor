"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  type CellProps,
  type Column,
  DataSheetGrid,
  keyColumn,
} from "react-datasheet-grid"
import { Trash2Icon, UserPlusIcon } from "lucide-react"
import { toast } from "sonner"

import {
  addTeacherByEmail,
  saveTeachers,
  type TeacherRow,
} from "@/app/(main)/teachers/actions"
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
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type TeacherStatus = "Active" | "Inactive"
type TeacherRole = "Teacher" | "Admin Teacher"

type Teacher = TeacherRow

type SelectOption<T extends string> = {
  label: string
  value: T
}

type SelectColumnData<T extends string> = {
  options: readonly SelectOption<T>[]
  badge?: boolean
}

const statusOptions: readonly SelectOption<TeacherStatus>[] = [
  { label: "Active", value: "Active" },
  { label: "Inactive", value: "Inactive" },
]

const roleOptions: readonly SelectOption<TeacherRole>[] = [
  { label: "Teacher", value: "Teacher" },
  { label: "Admin Teacher", value: "Admin Teacher" },
]

function SelectCell<T extends string>({
  rowData,
  setRowData,
  focus,
  stopEditing,
  columnData,
}: CellProps<T, SelectColumnData<T>>) {
  if (!focus) {
    return (
      <span
        className={cn(
          "mx-2 truncate",
          columnData.badge && "border px-2 py-0.5 font-medium",
          columnData.badge &&
            rowData === "Active" &&
            "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
          columnData.badge &&
            rowData === "Inactive" &&
            "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
        )}
      >
        {columnData.options.find((option) => option.value === rowData)?.label ??
          rowData}
      </span>
    )
  }

  return (
    <select
      autoFocus
      value={rowData}
      className="h-full w-full bg-background px-2 text-xs outline-none"
      onChange={(event) => {
        setRowData(event.target.value as T)
        stopEditing({ nextRow: false })
      }}
      onBlur={() => stopEditing({ nextRow: false })}
    >
      {columnData.options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

function selectColumn<T extends string>(
  columnData: SelectColumnData<T>
): Column<T, SelectColumnData<T>> {
  return {
    component: SelectCell<T>,
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

const numberColumn: Column<Teacher> = {
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

const fullNameColumn: Column<Teacher> = {
  component: ({ rowData }) => (
    <Link
      href={`/teachers/${rowData.id}`}
      className="mx-2 truncate font-normal text-foreground underline-offset-4 hover:underline"
    >
      {rowData.fullName}
    </Link>
  ),
  disabled: true,
  copyValue: ({ rowData }) => rowData.fullName,
  pasteValue: ({ rowData }) => rowData,
  deleteValue: ({ rowData }) => rowData,
}

const emailColumn: Column<Teacher> = {
  component: ({ rowData }) => (
    <span className="mx-2 truncate font-normal text-foreground">
      {rowData.email}
    </span>
  ),
  disabled: true,
  copyValue: ({ rowData }) => rowData.email,
  pasteValue: ({ rowData }) => rowData,
  deleteValue: ({ rowData }) => rowData,
}

function ActionsCell({
  rowData,
  columnData,
}: CellProps<Teacher, { removeTeacher: (id: string) => void }>) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className="flex w-full justify-center">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Delete ${rowData.fullName}`}
        title="Delete"
        onClick={() => setOpen(true)}
      >
        <Trash2Icon className="text-destructive" />
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove teacher access?</AlertDialogTitle>
            <AlertDialogDescription>
              {rowData.fullName} will lose teacher access after you save. Their
              profile, homeroom assignments, signatures, and report history will
              remain available.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancelButton>Cancel</AlertDialogCancelButton>
            <AlertDialogActionButton
              onClick={() => columnData.removeTeacher(rowData.id)}
            >
              Remove access
            </AlertDialogActionButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

const actionsColumn: Column<
  Teacher,
  { removeTeacher: (id: string) => void }
> = {
  component: ActionsCell,
  columnData: { removeTeacher: () => undefined },
  disableKeys: true,
  keepFocus: true,
  copyValue: () => null,
  pasteValue: ({ rowData }) => rowData,
  deleteValue: ({ rowData }) => rowData,
}

const readonlyActionsColumn: Column<Teacher> = {
  ...actionsColumn,
  component: () => null,
  disabled: true,
}

const columns: Column<Teacher>[] = [
  {
    ...numberColumn,
    title: "No.",
    minWidth: 52,
    maxWidth: 52,
  },
  {
    ...fullNameColumn,
    title: "Full Name",
    minWidth: 220,
  },
  {
    ...emailColumn,
    title: "Email",
    minWidth: 230,
  },
  {
    ...keyColumn<Teacher, "status">(
      "status",
      selectColumn({ options: statusOptions, badge: true })
    ),
    title: "Status",
    minWidth: 120,
  },
  {
    ...keyColumn<Teacher, "role">(
      "role",
      selectColumn({ options: roleOptions })
    ),
    title: "Role",
    minWidth: 150,
  },
  {
    ...actionsColumn,
    title: "Actions",
    minWidth: 64,
    maxWidth: 64,
  },
]

export function TeacherDataGrid({
  initialTeachers,
  canManage,
}: {
  initialTeachers: Teacher[]
  canManage: boolean
}) {
  const router = useRouter()
  const [teachers, setTeachers] = React.useState(initialTeachers)
  const [deletedIds, setDeletedIds] = React.useState<string[]>([])
  const [savedSnapshot, setSavedSnapshot] = React.useState(() =>
    serializeTeachers(initialTeachers)
  )
  const [pending, startTransition] = React.useTransition()
  const [email, setEmail] = React.useState("")
  const [leaveOpen, setLeaveOpen] = React.useState(false)
  const [nextUrl, setNextUrl] = React.useState("")
  const dirty = serializeTeachers(teachers) !== savedSnapshot
  const displayedColumns = canManage
    ? columns.map((column, index) =>
        index === columns.length - 1
          ? {
              ...column,
              columnData: {
                removeTeacher: (id: string) =>
                  handleChange(teachers.filter((row) => row.id !== id)),
              },
            }
          : column
      )
    : columns.map((column, index) =>
        index === columns.length - 1
          ? readonlyActionsColumn
          : { ...column, disabled: true }
      )

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

  function handleChange(nextTeachers: Teacher[]) {
    const nextIds = new Set(nextTeachers.map((row) => row.id))
    const removedIds = (JSON.parse(savedSnapshot) as TeacherSnapshot[])
      .filter((row) => !nextIds.has(row.id))
      .map((row) => row.id)

    setDeletedIds(removedIds)
    setTeachers(nextTeachers)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveTeachers(teachers, deletedIds)
      if (result.error) toast.error(result.error)
      if (result.success) {
        toast.success(result.success)
        setDeletedIds([])
        setSavedSnapshot(serializeTeachers(teachers))
      }
    })
  }

  function handleAddTeacher(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    startTransition(async () => {
      const result = await addTeacherByEmail(email)
      if (result.error) toast.error(result.error)
      if (result.success) toast.success(result.success)

      if (result.teacher) {
        const addedTeacher = result.teacher
        setTeachers((current) =>
          [...current, addedTeacher].sort((a, b) =>
            a.fullName.localeCompare(b.fullName)
          )
        )
        setSavedSnapshot((current) =>
          addTeacherToSnapshot(current, addedTeacher)
        )
        setEmail("")
      }
    })
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Teachers
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage teacher accounts, access status, and roles.
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
          <CardTitle>Teacher Data</CardTitle>
          {canManage && (
            <CardAction>
              <form onSubmit={handleAddTeacher} className="flex gap-2">
                <Input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="teacher@example.com"
                  aria-label="Teacher account email"
                  className="w-56"
                  maxLength={254}
                  required
                  autoFocus
                />
                <Button type="submit" disabled={pending}>
                  <UserPlusIcon />
                  {pending ? "Searching..." : "Find and add"}
                </Button>
              </form>
            </CardAction>
          )}
        </CardHeader>
        <CardContent className="px-0">
          <DataSheetGrid
            className="teacher-grid"
            value={teachers}
            onChange={handleChange}
            columns={displayedColumns}
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
              Teacher changes have not been saved. Leaving this page will
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

type TeacherSnapshot = Pick<Teacher, "id" | "status" | "role">

function serializeTeachers(teachers: Teacher[]) {
  return JSON.stringify(
    teachers
      .map(({ id, status, role }) => ({ id, status, role }))
      .sort((a, b) => a.id.localeCompare(b.id))
  )
}

function addTeacherToSnapshot(snapshot: string, teacher: Teacher) {
  const teachers = JSON.parse(snapshot) as TeacherSnapshot[]
  return JSON.stringify(
    [
      ...teachers,
      { id: teacher.id, status: teacher.status, role: teacher.role },
    ].sort((a, b) => a.id.localeCompare(b.id))
  )
}
