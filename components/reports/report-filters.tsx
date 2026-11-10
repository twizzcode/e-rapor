"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { FileDownIcon } from "lucide-react"

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
import {
  getAcademicPeriodFromSemesterNumber,
  MAX_SEMESTER,
} from "@/lib/academic-period"

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

export function ReportFilters({
  classes,
  initialReportType,
  initialClassId,
  initialSemester,
  initialMonth,
  initialYear,
}: {
  classes: { id: string; name: string; cohortYear: number }[]
  initialReportType: "monthly" | "semester"
  initialClassId: string
  initialSemester: string
  initialMonth: string
  initialYear: string
}) {
  const router = useRouter()
  const [classId, setClassId] = React.useState(initialClassId)
  const [semester, setSemester] = React.useState(initialSemester)
  const [month, setMonth] = React.useState(initialMonth)
  const [year, setYear] = React.useState(initialYear)
  const selectedClass = classes.find((row) => row.id === classId)
  const semesterOptions = Array.from({ length: MAX_SEMESTER }, (_, index) => {
    const semesterNumber = index + 1
    if (!selectedClass) {
      return {
        value: String(semesterNumber),
        label: `Semester ${semesterNumber}`,
      }
    }
    const period = getAcademicPeriodFromSemesterNumber(
      selectedClass.cohortYear,
      semesterNumber
    )
    return {
      value: String(semesterNumber),
      label: `Semester ${semesterNumber} — Grade ${period.grade}, Semester ${period.semesterInYear}`,
    }
  })

  function applyFilters(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!classId) return
    const params = new URLSearchParams({
      reportType: initialReportType,
      classId,
    })
    if (initialReportType === "monthly") {
      params.set("month", month)
      params.set("year", year)
    } else {
      params.set("semester", semester)
    }
    router.push(`/input-scores?${params}`)
  }

  function exportReport() {
    if (!classId) return
    const path =
      initialReportType === "monthly"
        ? `/reports/monthly/export?${new URLSearchParams({ classId, month, year })}`
        : `/reports/semester/export?${new URLSearchParams({ classId, semester })}`
    router.push(path)
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>Report Setup</CardTitle>
        <CardDescription>
          {initialReportType === "monthly"
            ? "Choose class, month, and year to input or export reports."
            : "Choose class and semester to input or export reports. Grade and academic year are calculated from the class cohort."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={applyFilters}>
          <FieldGroup className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Field>
              <FieldLabel htmlFor="classId">Class</FieldLabel>
              <Select
                value={classId || null}
                onValueChange={(value) => value && setClassId(value)}
              >
                <SelectTrigger id="classId" className="w-full">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classGroup) => (
                    <SelectItem key={classGroup.id} value={classGroup.id}>
                      {classGroup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            {initialReportType === "semester" && (
              <Field>
                <FieldLabel htmlFor="semester">Semester</FieldLabel>
                <Select
                  value={semester}
                  onValueChange={(value) => value && setSemester(value)}
                >
                  <SelectTrigger id="semester" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {semesterOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            {initialReportType === "monthly" && (
              <Field>
                <FieldLabel htmlFor="month">Month</FieldLabel>
                <Select
                  value={month}
                  onValueChange={(value) => value && setMonth(value)}
                >
                  <SelectTrigger id="month" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((name, index) => (
                      <SelectItem key={name} value={String(index + 1)}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            {initialReportType === "monthly" && (
              <Field>
                <FieldLabel htmlFor="year">Year</FieldLabel>
                <Select
                  value={year}
                  onValueChange={(value) => value && setYear(value)}
                >
                  <SelectTrigger id="year" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[2025, 2026, 2027, 2028].map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            <div className="flex gap-2 sm:col-span-2 xl:col-span-3">
              <Button type="submit" disabled={!classId}>
                Show input table
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={!classId}
                onClick={exportReport}
              >
                <FileDownIcon />
                Export report
              </Button>
            </div>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
