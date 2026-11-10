"use server"

import { randomUUID } from "node:crypto"

import { and, eq, isNull, or } from "drizzle-orm"
import type { BatchItem } from "drizzle-orm/batch"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { db } from "@/db"
import {
  classMember,
  tahsinTahfidzReport,
  teacher,
  type TahsinTahfidzWeek,
  user,
} from "@/db/schema"
import { auth } from "@/lib/auth"

export type BulkTahsinTahfidzReportRow = {
  studentId: string
  levelCategory: string
  weeks: TahsinTahfidzWeek[]
  targetAchievement: string
  overallPerformance: string
  teacherNotes: string
  reportDate: string
}

export type BulkTahsinTahfidzReportInput = {
  classId: string
  teacherId: string
  semester: number
  month: number
  year: number
  reports: BulkTahsinTahfidzReportRow[]
}

const levelCategories = ["Advanced", "Intermediate", "Basic"]
const grades = ["A", "B", "PB", ""]
const targetAchievements = ["Meets Target", "Above Target", "Below Target", ""]
const overallPerformances = ["A", "B", "PB", ""]

export async function saveTahsinTahfidzReports(
  input: BulkTahsinTahfidzReportInput
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (
    !session ||
    (session.user.role !== "teacher" && session.user.role !== "admin")
  ) {
    return { error: "Only teachers can update reports." }
  }

  const classId = cleanId(input.classId)
  const teacherId = cleanId(input.teacherId)
  if (
    !classId ||
    !teacherId ||
    ![1, 2].includes(input.semester) ||
    !Number.isInteger(input.month) ||
    input.month < 1 ||
    input.month > 12 ||
    !Number.isInteger(input.year) ||
    input.year < 2020 ||
    input.year > 2100 ||
    !Array.isArray(input.reports) ||
    input.reports.length > 200
  ) {
    return { error: "Invalid report data." }
  }

  const reports = input.reports.map(cleanReport)
  if (
    reports.some((report) => !report) ||
    new Set(reports.map((report) => report?.studentId)).size !== reports.length
  ) {
    return { error: "One or more student reports contain invalid data." }
  }
  const validReports = reports as BulkTahsinTahfidzReportRow[]

  const [classMembers, selectedTeacher] = await Promise.all([
    db
      .select({ studentId: classMember.studentId })
      .from(classMember)
      .where(eq(classMember.classId, classId)),
    db
      .select({ id: user.id })
      .from(user)
      .leftJoin(teacher, eq(teacher.userId, user.id))
      .where(
        and(
          eq(user.id, teacherId),
          or(eq(user.role, "teacher"), eq(user.role, "admin")),
          or(eq(teacher.active, true), isNull(teacher.active))
        )
      )
      .limit(1),
  ])
  const memberIds = new Set(classMembers.map((row) => row.studentId))
  if (
    selectedTeacher.length !== 1 ||
    memberIds.size !== validReports.length ||
    validReports.some((report) => !memberIds.has(report.studentId))
  ) {
    return { error: "Report contains invalid students or teacher." }
  }

  try {
    const queries: BatchItem<"pg">[] = validReports.map((report) =>
      db
        .insert(tahsinTahfidzReport)
        .values({
          id: randomUUID(),
          studentId: report.studentId,
          classId,
          teacherId,
          semester: input.semester,
          month: input.month,
          year: input.year,
          levelCategory: report.levelCategory,
          weeks: report.weeks,
          targetAchievement: report.targetAchievement,
          overallPerformance: report.overallPerformance,
          teacherNotes: report.teacherNotes,
          reportDate: report.reportDate || null,
        })
        .onConflictDoUpdate({
          target: [
            tahsinTahfidzReport.studentId,
            tahsinTahfidzReport.year,
            tahsinTahfidzReport.month,
            tahsinTahfidzReport.semester,
            tahsinTahfidzReport.teacherId,
          ],
          set: {
            classId,
            levelCategory: report.levelCategory,
            weeks: report.weeks,
            targetAchievement: report.targetAchievement,
            overallPerformance: report.overallPerformance,
            teacherNotes: report.teacherNotes,
            reportDate: report.reportDate || null,
            updatedAt: new Date(),
          },
        })
    )
    if (queries.length) {
      await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]])
    }
  } catch (error) {
    console.error("Failed to save Tahsin Tahfidz reports", error)
    return { error: "Could not save Tahsin Tahfidz reports." }
  }

  revalidatePath("/reports/tahsin-tahfidz")
  return { success: "Tahsin Tahfidz reports saved.", reports: validReports }
}

function cleanReport(value: BulkTahsinTahfidzReportRow) {
  const studentId = cleanId(value.studentId)
  const weeks = cleanWeeks(value.weeks)
  const reportDate = cleanDate(value.reportDate)
  if (
    !studentId ||
    !levelCategories.includes(value.levelCategory) ||
    !weeks ||
    !targetAchievements.includes(value.targetAchievement) ||
    !overallPerformances.includes(value.overallPerformance) ||
    typeof value.teacherNotes !== "string" ||
    value.teacherNotes.trim().length > 1200 ||
    reportDate === null
  ) {
    return null
  }
  return {
    studentId,
    levelCategory: value.levelCategory,
    weeks,
    targetAchievement: value.targetAchievement,
    overallPerformance: value.overallPerformance,
    teacherNotes: value.teacherNotes.trim(),
    reportDate,
  }
}

function cleanWeeks(value: unknown) {
  if (!Array.isArray(value) || value.length !== 4) return null
  const result: TahsinTahfidzWeek[] = []
  for (const week of value) {
    if (!week || typeof week !== "object" || Array.isArray(week)) return null
    const row = week as Partial<TahsinTahfidzWeek>
    const dateRange = cleanText(row.dateRange, 100)
    const tahfidzLines = cleanNumber(row.tahfidzLines)
    const murojaahPages = cleanNumber(row.murojaahPages)
    const tahsinPages = cleanNumber(row.tahsinPages)
    if (
      dateRange === null ||
      tahfidzLines === undefined ||
      murojaahPages === undefined ||
      tahsinPages === undefined ||
      typeof row.grade !== "string" ||
      !grades.includes(row.grade)
    ) {
      return null
    }
    result.push({
      dateRange,
      tahfidzLines,
      murojaahPages,
      tahsinPages,
      grade: row.grade as TahsinTahfidzWeek["grade"],
    })
  }
  return result
}

function cleanNumber(value: unknown) {
  return value === null || value === ""
    ? null
    : typeof value === "number" &&
        Number.isInteger(value) &&
        value >= 0 &&
        value <= 10000
      ? value
      : undefined
}

function cleanDate(value: unknown) {
  if (value === "") return ""
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }
  const date = new Date(`${value}T00:00:00Z`)
  return Number.isNaN(date.valueOf()) ||
    date.toISOString().slice(0, 10) !== value
    ? null
    : value
}

function cleanText(value: unknown, maximum: number) {
  return typeof value === "string" && value.trim().length <= maximum
    ? value.trim()
    : null
}

function cleanId(value: unknown) {
  return typeof value === "string" && value.trim().length <= 100
    ? value.trim()
    : ""
}
