"use client"

import * as React from "react"
import Link from "next/link"
import {
  type CellProps,
  type Column,
  DataSheetGrid,
} from "react-datasheet-grid"
import {
  CheckIcon,
  ChevronsUpDownIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react"
import { toast } from "sonner"

import {
  addClassMembers,
  removeClassMember,
} from "@/app/(main)/classes/actions"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type StudentOption = {
  id: string
  name: string
  nis: string
  nisn: string | null
}

type ActionData = {
  canManage: boolean
  pending: boolean
  removeMember: (member: StudentOption) => void
}

const numberColumn: Column<StudentOption> = {
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

const nameColumn: Column<StudentOption> = {
  component: ({ rowData }) => (
    <Link
      href={`/students/${rowData.id}`}
      className="mx-2 truncate underline-offset-4 hover:underline"
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
  value: (student: StudentOption) => string | null
): Column<StudentOption> {
  return {
    component: ({ rowData }) => (
      <span className="mx-2 truncate">{value(rowData) || "—"}</span>
    ),
    disabled: true,
    copyValue: ({ rowData }) => value(rowData) ?? "",
    pasteValue: ({ rowData }) => rowData,
    deleteValue: ({ rowData }) => rowData,
  }
}

export function ClassMembers({
  classId,
  className,
  initialMembers,
  initialAvailableStudents,
  canManage,
}: {
  classId: string
  className: string
  initialMembers: StudentOption[]
  initialAvailableStudents: StudentOption[]
  canManage: boolean
}) {
  const [members, setMembers] = React.useState(initialMembers)
  const [availableStudents, setAvailableStudents] = React.useState(
    initialAvailableStudents
  )
  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [pending, startTransition] = React.useTransition()
  const normalizedSearch = search.trim().toLocaleLowerCase("id")
  const filteredStudents = normalizedSearch
    ? availableStudents
        .map((student) => ({
          student,
          relevance: studentSearchRelevance(student, normalizedSearch),
        }))
        .filter((result) => result.relevance !== null)
        .sort(
          (a, b) =>
            a.relevance! - b.relevance! ||
            a.student.name.localeCompare(b.student.name)
        )
        .map((result) => result.student)
    : availableStudents.filter((student) => selectedIds.includes(student.id))

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedIds.length) return toast.error("Select at least one student.")

    startTransition(async () => {
      const result = await addClassMembers(classId, selectedIds)
      if (result.error) return void toast.error(result.error)

      const selected = new Set(selectedIds)
      const availableById = new Map(
        availableStudents.map((student) => [student.id, student])
      )
      const added = selectedIds.flatMap((id) => {
        const student = availableById.get(id)
        return student ? [student] : []
      })
      setMembers((current) => [...current, ...added])
      setAvailableStudents((current) =>
        current.filter((student) => !selected.has(student.id))
      )
      setSelectedIds([])
      setSearch("")
      setPickerOpen(false)
      toast.success(result.success)
    })
  }

  function toggleStudent(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((studentId) => studentId !== id)
        : [...current, id]
    )
  }

  function handleRemove(member: StudentOption) {
    if (!window.confirm(`Remove ${member.name} from this class?`)) return

    startTransition(async () => {
      const result = await removeClassMember(classId, member.id)
      if (result.error) return void toast.error(result.error)

      setMembers((current) =>
        current.filter((student) => student.id !== member.id)
      )
      setAvailableStudents((current) =>
        [...current, member].sort((a, b) => a.name.localeCompare(b.name))
      )
      toast.success(result.success)
    })
  }

  const columns: Column<StudentOption>[] = [
    { ...numberColumn, title: "No.", minWidth: 56, maxWidth: 56 },
    { ...nameColumn, title: "Student Name", minWidth: 240 },
    {
      ...readonlyColumn((student) => student.nis),
      title: "NIS",
      minWidth: 150,
    },
    {
      ...readonlyColumn((student) => student.nisn),
      title: "NISN",
      minWidth: 150,
    },
    {
      component: ActionsCell,
      columnData: {
        canManage,
        pending,
        removeMember: handleRemove,
      },
      title: "Actions",
      minWidth: 100,
      maxWidth: 100,
      disableKeys: true,
      keepFocus: true,
      copyValue: () => null,
      pasteValue: ({ rowData }) => rowData,
      deleteValue: ({ rowData }) => rowData,
    },
  ]

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>
          {className} Members ({members.length})
        </CardTitle>
        {canManage && (
          <form
            onSubmit={handleAdd}
            className="mt-3 flex flex-col gap-2 sm:flex-row"
          >
            <Popover
              open={pickerOpen}
              onOpenChange={(open) => {
                setPickerOpen(open)
                if (!open) setSearch("")
              }}
            >
              <PopoverTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={pickerOpen}
                    className="w-full justify-between font-normal sm:w-96"
                    disabled={pending || availableStudents.length === 0}
                  />
                }
              >
                <span className="truncate">
                  {selectedIds.length
                    ? `${selectedIds.length} student${selectedIds.length === 1 ? "" : "s"} selected`
                    : availableStudents.length
                      ? "Search students by name, NIS, or NISN"
                      : "No students without a class"}
                </span>
                <ChevronsUpDownIcon className="opacity-50" />
              </PopoverTrigger>
              <PopoverContent align="start" className="w-(--anchor-width) p-0">
                <div className="border-b p-2">
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search name, NIS, or NISN..."
                    autoFocus
                  />
                </div>
                <div className="max-h-72 overflow-y-auto p-1">
                  {filteredStudents.map((student) => {
                    const selected = selectedIds.includes(student.id)
                    return (
                      <button
                        key={student.id}
                        type="button"
                        aria-pressed={selected}
                        className="flex w-full items-center gap-2 px-2 py-2 text-left text-xs hover:bg-accent hover:text-accent-foreground"
                        onClick={() => toggleStudent(student.id)}
                      >
                        <span
                          className={cn(
                            "flex size-4 shrink-0 items-center justify-center border",
                            selected &&
                              "border-primary bg-primary text-primary-foreground"
                          )}
                        >
                          {selected && <CheckIcon className="size-3" />}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{student.name}</span>
                          <span className="block truncate text-muted-foreground">
                            NIS {student.nis}
                            {student.nisn ? ` · NISN ${student.nisn}` : ""}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                  {filteredStudents.length === 0 && (
                    <p className="px-3 py-6 text-center text-xs text-muted-foreground">
                      {normalizedSearch
                        ? "No students found."
                        : "Search to find students."}
                    </p>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button type="submit" disabled={pending || !selectedIds.length}>
              <UserPlusIcon />
              {pending
                ? "Adding..."
                : selectedIds.length
                  ? `Add ${selectedIds.length} member${selectedIds.length === 1 ? "" : "s"}`
                  : "Add members"}
            </Button>
          </form>
        )}
      </CardHeader>
      <CardContent className="px-0">
        {members.length === 0 ? (
          <p className="px-4 py-12 text-center text-xs text-muted-foreground">
            No students in this class.
          </p>
        ) : (
          <DataSheetGrid
            className="teacher-grid"
            value={members}
            onChange={() => undefined}
            columns={columns}
            rowKey="id"
            rowHeight={44}
            headerRowHeight={40}
            gutterColumn={false}
            lockRows
            disableContextMenu
            disableExpandSelection
          />
        )}
      </CardContent>
    </Card>
  )
}

function studentSearchRelevance(
  student: StudentOption,
  search: string
): number | null {
  const values = [student.name, student.nis, student.nisn ?? ""].map((value) =>
    value.toLocaleLowerCase("id")
  )
  if (values.some((value) => value === search)) return 0
  if (values.some((value) => value.startsWith(search))) return 1
  if (
    values.some((value) =>
      value.split(/\s+/).some((word) => word.startsWith(search))
    )
  ) {
    return 2
  }
  return values.some((value) => value.includes(search)) ? 3 : null
}

function ActionsCell({
  rowData,
  columnData,
}: CellProps<StudentOption, ActionData>) {
  return (
    <div className="flex w-full justify-center">
      {columnData.canManage ? (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Remove ${rowData.name}`}
          title="Remove from class"
          disabled={columnData.pending}
          onClick={() => columnData.removeMember(rowData)}
        >
          <Trash2Icon className="text-destructive" />
        </Button>
      ) : (
        <Link
          href={`/students/${rowData.id}`}
          className={buttonVariants({ variant: "ghost", size: "sm" })}
        >
          View
        </Link>
      )}
    </div>
  )
}
