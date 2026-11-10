"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  type Column,
  createTextColumn,
  DataSheetGrid,
  keyColumn,
} from "react-datasheet-grid"
import { PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import {
  saveSubjects,
  type SubjectAssessmentRow,
} from "@/app/(main)/subjects/actions"
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

const levels = ["Exceeding", "Meeting", "Developing", "Emerging"] as const

export function SubjectAssessmentGrid({
  rows: initialRows,
  canManage,
}: {
  rows: SubjectAssessmentRow[]
  canManage: boolean
}) {
  const router = useRouter()
  const [rows, setRows] = React.useState(initialRows)
  const [savedRows, setSavedRows] = React.useState(initialRows)
  const [deletedSubjectIds, setDeletedSubjectIds] = React.useState<string[]>([])
  const [pending, startTransition] = React.useTransition()
  const [leaveOpen, setLeaveOpen] = React.useState(false)
  const [nextUrl, setNextUrl] = React.useState("")
  const savedSubjectIds = React.useRef(
    new Set(initialRows.map((row) => row.subjectId))
  )
  const isDirty =
    deletedSubjectIds.length > 0 ||
    JSON.stringify(rows) !== JSON.stringify(savedRows)
  const subjects = groupRows(rows)
  const columns = React.useMemo<Column<SubjectAssessmentRow>[]>(
    () => [
      {
        ...keyColumn<SubjectAssessmentRow, "level">(
          "level",
          createTextColumn<string>()
        ),
        title: "Level Description",
        minWidth: 140,
        maxWidth: 180,
        disabled: true,
      },
      {
        ...keyColumn<SubjectAssessmentRow, "description">(
          "description",
          createTextColumn<string>({ continuousUpdates: true })
        ),
        title: "Descriptive",
        minWidth: 520,
        disabled: !canManage,
      },
    ],
    [canManage]
  )

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
  }, [isDirty, pending])

  function updateSubjectName(subjectId: string, subject: string) {
    setRows((current) =>
      current.map((row) =>
        row.subjectId === subjectId ? { ...row, subject } : row
      )
    )
  }

  function updateSubjectRows(
    subjectId: string,
    nextRows: SubjectAssessmentRow[]
  ) {
    const nextById = new Map(nextRows.map((row) => [row.id, row]))
    setRows((current) =>
      current.map((row) =>
        row.subjectId === subjectId ? (nextById.get(row.id) ?? row) : row
      )
    )
  }

  function addSubject() {
    const subjectId = crypto.randomUUID()
    const existingNames = new Set(rows.map((row) => row.subject))
    let subjectName = "New Subject"
    let suffix = 2

    while (existingNames.has(subjectName)) {
      subjectName = `New Subject ${suffix}`
      suffix += 1
    }

    setRows((current) => [
      ...current,
      ...levels.map((level) => ({
        id: crypto.randomUUID(),
        subjectId,
        subject: subjectName,
        level,
        description: "",
      })),
    ])
  }

  function deleteSubject(subjectId: string, subjectName: string) {
    if (!window.confirm(`Delete ${subjectName} and all its descriptions?`)) {
      return
    }

    setRows((current) => current.filter((row) => row.subjectId !== subjectId))
    if (savedSubjectIds.current.has(subjectId)) {
      setDeletedSubjectIds((current) => [...new Set([...current, subjectId])])
    }
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveSubjects(rows, deletedSubjectIds)
      if (result.error) return void toast.error(result.error)

      const saved = result.rows ?? rows
      setRows(saved)
      setSavedRows(saved)
      setDeletedSubjectIds([])
      savedSubjectIds.current = new Set(saved.map((row) => row.subjectId))
      toast.success(result.success)
    })
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Subjects
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage achievement descriptions for each subject.
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={addSubject}
              disabled={pending}
            >
              <PlusIcon />
              Add subject
            </Button>
            <Button onClick={handleSave} disabled={pending || !isDirty}>
              {pending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {subjects.map((subject) => (
          <Card key={subject.subjectId}>
            <CardHeader className="border-b">
              <CardTitle>
                {canManage ? (
                  <input
                    value={subject.name}
                    onChange={(event) =>
                      updateSubjectName(subject.subjectId, event.target.value)
                    }
                    aria-label="Subject name"
                    maxLength={100}
                    className="w-full bg-transparent outline-none focus:ring-1 focus:ring-ring"
                  />
                ) : (
                  subject.name
                )}
              </CardTitle>
              {canManage && (
                <CardAction>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${subject.name}`}
                    onClick={() =>
                      deleteSubject(subject.subjectId, subject.name)
                    }
                    disabled={pending}
                  >
                    <Trash2Icon />
                  </Button>
                </CardAction>
              )}
            </CardHeader>
            <CardContent className="px-0">
              <DataSheetGrid
                className="teacher-grid"
                value={subject.rows}
                onChange={(nextRows) =>
                  updateSubjectRows(subject.subjectId, nextRows)
                }
                columns={columns}
                height={250}
                rowKey="id"
                rowHeight={52}
                headerRowHeight={40}
                gutterColumn={false}
                lockRows
                disableContextMenu
                disableExpandSelection
              />
            </CardContent>
          </Card>
        ))}

        {subjects.length === 0 && (
          <p className="border p-6 text-center text-sm text-muted-foreground">
            No subjects yet.
          </p>
        )}
      </div>

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Subject changes have not been saved. Leaving this page will
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

function groupRows(rows: SubjectAssessmentRow[]) {
  const groups = new Map<
    string,
    { subjectId: string; name: string; rows: SubjectAssessmentRow[] }
  >()

  for (const row of rows) {
    const group = groups.get(row.subjectId)
    if (group) group.rows.push(row)
    else {
      groups.set(row.subjectId, {
        subjectId: row.subjectId,
        name: row.subject,
        rows: [row],
      })
    }
  }

  return [...groups.values()]
}
