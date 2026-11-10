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

type TeacherOption = { id: string; name: string; nip: string | null }
type ClassData = {
  id: string
  name: string
  gradeLevel: number
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
  const [gradeLevel, setGradeLevel] = React.useState<string | null>(
    classData ? String(classData.gradeLevel) : null
  )
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
              <FieldLabel htmlFor="gradeLevel">Grade level</FieldLabel>
              <Select
                name="gradeLevel"
                value={gradeLevel}
                onValueChange={setGradeLevel}
                required
              >
                <SelectTrigger id="gradeLevel" className="w-full">
                  <SelectValue placeholder="Select grade level" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((grade) => (
                    <SelectItem key={grade} value={String(grade)}>
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
