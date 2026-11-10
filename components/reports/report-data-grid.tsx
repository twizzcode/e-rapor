"use client"

import {
  type CellProps,
  type Column,
  createTextColumn,
  DataSheetGrid,
  keyColumn,
} from "react-datasheet-grid"

export type ReportGridRow = {
  studentId: string
  name: string
  [key: string]: string
}

type GridItem = { id: string; name: string }

const levels = ["Exceeding", "Meeting", "Developing", "Emerging"]

export function ReportDataGrid({
  rows,
  items,
  onChange,
  canManage,
  type,
}: {
  rows: ReportGridRow[]
  items: GridItem[]
  onChange: (rows: ReportGridRow[]) => void
  canManage: boolean
  type: "level" | "text"
}) {
  const columns: Column<ReportGridRow>[] = [
    {
      ...keyColumn<ReportGridRow, "name">("name", createTextColumn<string>()),
      title: "Student",
      minWidth: 220,
      disabled: true,
    },
    ...items.map((item) => {
      const key = reportGridKey(item.id)
      return {
        ...keyColumn<ReportGridRow, keyof ReportGridRow>(
          key,
          type === "level"
            ? levelColumn
            : createTextColumn<string>({ continuousUpdates: true })
        ),
        title: item.name,
        minWidth: type === "text" ? 600 : 170,
        disabled: !canManage,
      }
    }),
  ]

  return (
    <DataSheetGrid
      className="teacher-grid report-input-grid"
      value={rows}
      onChange={onChange}
      columns={columns}
      rowKey="studentId"
      rowHeight={type === "text" ? 56 : 44}
      headerRowHeight={44}
      gutterColumn={false}
      lockRows
      disableContextMenu
    />
  )
}

export function reportGridKey(id: string) {
  return `report:${id}`
}

const levelColumn: Column<string> = {
  component: LevelCell,
  disableKeys: true,
  keepFocus: true,
  deleteValue: () => "",
  copyValue: ({ rowData }) => rowData ?? "",
  pasteValue: ({ rowData, value }) => {
    const pasted = value.trim()
    if (!pasted) return ""
    return (
      levels.find((level) => level.toLowerCase() === pasted.toLowerCase()) ??
      rowData
    )
  },
}

function LevelCell({
  rowData,
  setRowData,
  focus,
  stopEditing,
}: CellProps<string>) {
  if (!focus)
    return (
      <span
        className={`mx-2 truncate border px-2 py-0.5 font-medium ${levelBadgeClass(rowData)}`}
      >
        {rowData}
      </span>
    )

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
      <option value="">Select level</option>
      {levels.map((level) => (
        <option key={level} value={level}>
          {level}
        </option>
      ))}
    </select>
  )
}

function levelBadgeClass(level: string) {
  switch (level) {
    case "Exceeding":
      return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
    case "Meeting":
      return "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-300"
    case "Developing":
      return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
    case "Emerging":
      return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300"
    default:
      return ""
  }
}
