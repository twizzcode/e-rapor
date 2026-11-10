"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { saveClass } from "@/app/(main)/classes/actions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAcademicYearStart } from "@/lib/academic-period"

type TeacherOption = { id: string; name: string; nip: string | null }
type ClassData = {
  id: string
  name: string
  cohortYear: number
  homeroomTeacherId: string
}

export function ClassForm({
  teachers,
  classData,
}: {
  teachers: TeacherOption[]
  classData?: ClassData
}) {
  const router = useRouter()
  const [state, action, pending] = React.useActionState(saveClass, {})
  const [cohortYear, setCohortYear] = React.useState(() => {
    if (classData) return String(classData.cohortYear)
    const now = new Date()
    return String(getAcademicYearStart(now.getFullYear(), now.getMonth() + 1))
  })
  const [homeroomTeacherId, setHomeroomTeacherId] = React.useState<
    string | null
  >(classData?.homeroomTeacherId || null)

  React.useEffect(() => {
    if (state.error) toast.error(state.error)
    if (state.success && state.classId) {
      toast.success(state.success)
      router.push(`/classes/${state.classId}`)
    }
  }, [router, state])

  return (
    <form action={action} className="space-y-6">
      {classData && <input type="hidden" name="id" value={classData.id} />}
      <Card>
        <CardHeader className="border-b">
          <CardTitle>Class Information</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-5 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="name">Class name</FieldLabel>
              <Input
                id="name"
                name="name"
                defaultValue={classData?.name}
                maxLength={100}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cohortYear">Cohort year</FieldLabel>
              <Input
                id="cohortYear"
                name="cohortYear"
                type="number"
                min={2000}
                max={2100}
                value={cohortYear}
                onChange={(event) => setCohortYear(event.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Year this class started grade 1. Grade and semester are
                calculated from this and the report period.
              </p>
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel htmlFor="homeroomTeacherId">
                Homeroom teacher
              </FieldLabel>
              <Select
                name="homeroomTeacherId"
                value={homeroomTeacherId}
                onValueChange={setHomeroomTeacherId}
              >
                <SelectTrigger id="homeroomTeacherId" className="w-full">
                  <SelectValue placeholder="Select homeroom teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((teacher) => (
                    <SelectItem key={teacher.id} value={teacher.id}>
                      {teacher.name}
                      {teacher.nip ? ` — ${teacher.nip}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save class"}
        </Button>
      </div>
    </form>
  )
}
