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
  savePersonalSocialRubric,
  type PersonalSocialRow,
} from "@/app/(main)/personal-social/actions"
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

const levelFields = [
  ["Exceeding", "exceeding"],
  ["Meeting", "meeting"],
  ["Developing", "developing"],
  ["Emerging", "emerging"],
] as const

type LevelRow = {
  level: string
  field: (typeof levelFields)[number][1]
  description: string
}

export function PersonalSocialGrid({
  initialRows,
  canManage,
}: {
  initialRows: PersonalSocialRow[]
  canManage: boolean
}) {
  const router = useRouter()
  const [rows, setRows] = React.useState(initialRows)
  const [savedRows, setSavedRows] = React.useState(initialRows)
  const [deletedIds, setDeletedIds] = React.useState<string[]>([])
  const [pending, startTransition] = React.useTransition()
  const [leaveOpen, setLeaveOpen] = React.useState(false)
  const [nextUrl, setNextUrl] = React.useState("")
  const savedIds = React.useRef(new Set(initialRows.map((row) => row.id)))
  const isDirty =
    deletedIds.length > 0 || JSON.stringify(rows) !== JSON.stringify(savedRows)
  const columns = React.useMemo<Column<LevelRow>[]>(
    () => [
      {
        ...keyColumn<LevelRow, "level">("level", createTextColumn<string>()),
        title: "Level Description",
        minWidth: 140,
        maxWidth: 180,
        disabled: true,
      },
      {
        ...keyColumn<LevelRow, "description">(
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

  function updateAspect(id: string, aspect: string) {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, aspect } : row))
    )
  }

  function updateDescriptions(id: string, nextLevels: LevelRow[]) {
    setRows((current) =>
      current.map((row) => {
        if (row.id !== id) return row

        return nextLevels.reduce(
          (nextRow, level) => ({
            ...nextRow,
            [level.field]: level.description,
          }),
          row
        )
      })
    )
  }

  function addAspect() {
    const existingNames = new Set(rows.map((row) => row.aspect))
    let aspect = "New Aspect"
    let suffix = 2
    while (existingNames.has(aspect)) {
      aspect = `New Aspect ${suffix}`
      suffix += 1
    }

    setRows((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        aspect,
        exceeding: "",
        meeting: "",
        developing: "",
        emerging: "",
      },
    ])
  }

  function deleteAspect(id: string, aspect: string) {
    if (!window.confirm(`Delete ${aspect}?`)) return

    setRows((current) => current.filter((row) => row.id !== id))
    if (savedIds.current.has(id)) {
      setDeletedIds((current) => [...new Set([...current, id])])
    }
  }

  function handleSave() {
    startTransition(async () => {
      const result = await savePersonalSocialRubric(rows, deletedIds)
      if (result.error) return void toast.error(result.error)

      const saved = result.rows ?? rows
      setRows(saved)
      setSavedRows(saved)
      setDeletedIds([])
      savedIds.current = new Set(saved.map((row) => row.id))
      toast.success(result.success)
    })
  }

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Personal and Social Development
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage achievement descriptions for personal and social development.
          </p>
        </div>
        {canManage && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={addAspect}
              disabled={pending}
            >
              <PlusIcon />
              Add aspect
            </Button>
            <Button onClick={handleSave} disabled={pending || !isDirty}>
              {pending ? "Saving..." : "Save changes"}
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {rows.map((row) => {
          const levelRows: LevelRow[] = levelFields.map(([level, field]) => ({
            level,
            field,
            description: row[field],
          }))

          return (
            <Card key={row.id}>
              <CardHeader className="border-b">
                <CardTitle>
                  {canManage ? (
                    <input
                      value={row.aspect}
                      onChange={(event) =>
                        updateAspect(row.id, event.target.value)
                      }
                      aria-label="Aspect name"
                      maxLength={100}
                      className="w-full bg-transparent outline-none focus:ring-1 focus:ring-ring"
                    />
                  ) : (
                    row.aspect
                  )}
                </CardTitle>
                {canManage && (
                  <CardAction>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Delete ${row.aspect}`}
                      onClick={() => deleteAspect(row.id, row.aspect)}
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
                  value={levelRows}
                  onChange={(nextLevels) =>
                    updateDescriptions(row.id, nextLevels)
                  }
                  columns={columns}
                  height={250}
                  rowKey="field"
                  rowHeight={52}
                  headerRowHeight={40}
                  gutterColumn={false}
                  lockRows
                  disableContextMenu
                  disableExpandSelection
                />
              </CardContent>
            </Card>
          )
        })}

        {rows.length === 0 && (
          <p className="border p-6 text-center text-sm text-muted-foreground">
            No aspects yet.
          </p>
        )}
      </div>

      <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Personal and social changes have not been saved. Leaving this page
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
