"use client"

import * as React from "react"
import Link from "next/link"
import {
  type CellProps,
  type Column,
  createTextColumn,
  DataSheetGrid,
  keyColumn,
} from "react-datasheet-grid"
import { EyeIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { saveClasses, type ClassGridRow } from "@/app/(main)/classes/actions"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type Option = { label: string; value: string }
type SelectData = { options: Option[]; emptyLabel?: string }

export function ClassDataGrid({
  initialClasses,
  teachers,
  canManage,
}: {
  initialClasses: ClassGridRow[]
  teachers: { id: string; name: string }[]
  canManage: boolean
}) {
  const [rows, setRows] = React.useState(initialClasses)
  const [savedRows, setSavedRows] = React.useState(initialClasses)
  const [deletedIds, setDeletedIds] = React.useState<string[]>([])
  const [pending, startTransition] = React.useTransition()
  const savedIds = React.useRef(new Set(initialClasses.map((row) => row.id)))
  const isDirty =
    deletedIds.length > 0 || JSON.stringify(rows) !== JSON.stringify(savedRows)
  const teacherOptions = teachers.map((teacher) => ({
    value: teacher.id,
    label: teacher.name,
  }))
  const columns: Column<ClassGridRow>[] = [
    {
      ...keyColumn<ClassGridRow, "name">(
        "name",
        createTextColumn<string>({ continuousUpdates: true })
      ),
      title: "Class Name",
      minWidth: 200,
      disabled: !canManage,
    },
    {
      ...keyColumn<ClassGridRow, "gradeLevel">(
        "gradeLevel",
        selectColumn({
          options: [1, 2, 3, 4, 5, 6].map((grade) => ({
            value: String(grade),
            label: `Grade ${grade}`,
          })),
        })
      ),
      title: "Grade Level",
      minWidth: 130,
      disabled: !canManage,
    },
    {
      ...keyColumn<ClassGridRow, "homeroomTeacherId">(
        "homeroomTeacherId",
        selectColumn({ options: teacherOptions, emptyLabel: "Not assigned" })
      ),
      title: "Homeroom Teacher",
      minWidth: 220,
      disabled: !canManage,
    },
    {
      component: ({ rowData }) => (
        <span className="w-full px-2 text-center">{rowData.studentCount}</span>
      ),
      title: "Students",
      minWidth: 90,
      maxWidth: 110,
      disabled: true,
      copyValue: ({ rowData }) => rowData.studentCount,
      pasteValue: ({ rowData }) => rowData,
      deleteValue: ({ rowData }) => rowData,
    },
    {
      component: ActionsCell,
      columnData: { canManage },
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

  function addClass() {
    const names = new Set(rows.map((row) => row.name))
    let name = "New Class"
    let suffix = 2
    while (names.has(name)) name = `New Class ${suffix++}`
    setRows((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        name,
        gradeLevel: "1",
        homeroomTeacherId: "",
        homeroomTeacher: "",
        studentCount: 0,
      },
    ])
  }

  function handleChange(nextRows: ClassGridRow[]) {
    const nextIds = new Set(nextRows.map((row) => row.id))
    const removed = rows.filter((row) => !nextIds.has(row.id))
    setDeletedIds((current) => [
      ...new Set([
        ...current,
        ...removed
          .filter((row) => savedIds.current.has(row.id))
          .map((row) => row.id),
      ]),
    ])
    setRows(nextRows)
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveClasses(rows, deletedIds)
      if (result.error) return void toast.error(result.error)
      const saved = rows.map((row) => ({
        ...row,
        homeroomTeacher:
          teachers.find((teacher) => teacher.id === row.homeroomTeacherId)
            ?.name ?? "",
      }))
      setRows(saved)
      setSavedRows(saved)
      setDeletedIds([])
      savedIds.current = new Set(saved.map((row) => row.id))
      toast.success(result.success)
    })
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Class Data</CardTitle>
        {canManage && (
          <CardAction>
            <Button onClick={addClass} disabled={pending}>
              <PlusIcon />
              Add class
            </Button>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="px-0">
        <DataSheetGrid
          className="teacher-grid"
          value={rows}
          onChange={handleChange}
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
      {canManage && (
        <CardFooter className="justify-end">
          <Button onClick={handleSave} disabled={pending || !isDirty}>
            {pending ? "Saving..." : "Save changes"}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
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
    columnData.emptyLabel ??
    rowData
  if (!focus) return <span className="mx-2 truncate">{label}</span>

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
      {columnData.emptyLabel && (
        <option value="">{columnData.emptyLabel}</option>
      )}
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
    deleteValue: () => "",
    copyValue: ({ rowData }) =>
      columnData.options.find((option) => option.value === rowData)?.label ??
      "",
    pasteValue: ({ rowData, value }) =>
      columnData.options.find(
        (option) => option.label.toLowerCase() === value.trim().toLowerCase()
      )?.value ?? rowData,
  }
}

function ActionsCell({
  rowData,
  deleteRow,
  columnData,
}: CellProps<ClassGridRow, { canManage: boolean }>) {
  return (
    <div className="flex w-full justify-center gap-1">
      <Link
        href={`/classes/${rowData.id}`}
        aria-label={`View ${rowData.name}`}
        className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
      >
        <EyeIcon />
      </Link>
      {columnData.canManage && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Delete ${rowData.name}`}
          onClick={() => {
            if (
              window.confirm(
                `Delete ${rowData.name}? Members will be removed from this class.`
              )
            ) {
              deleteRow()
            }
          }}
        >
          <Trash2Icon className="text-destructive" />
        </Button>
      )}
    </div>
  )
}
