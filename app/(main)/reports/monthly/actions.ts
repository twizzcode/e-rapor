"use server"

import { randomUUID } from "node:crypto"

import type { BatchItem } from "drizzle-orm/batch"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { db } from "@/db"
import {
  classMember,
  monthlyReport,
  personalSocialRubric,
  subject,
} from "@/db/schema"
import { auth } from "@/lib/auth"

export type BulkMonthlyReportRow = {
  studentId: string
  subjectLevels: Record<string, string>
  personalSocialLevels: Record<string, string>
  generalComment: string
}

export type BulkMonthlyReportInput = {
  classId: string
  month: number
  year: number
  reports: BulkMonthlyReportRow[]
}

const levels = ["Exceeding", "Meeting", "Developing", "Emerging"]

export async function saveMonthlyReports(input: BulkMonthlyReportInput) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (
    !session ||
    (session.user.role !== "teacher" && session.user.role !== "admin")
  ) {
    return { error: "Only teachers can update reports." }
  }

  const classId = cleanId(input.classId)
  if (
    !classId ||
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
  const semester = input.month <= 6 ? 2 : 1

  const reports = input.reports.map((report) => ({
    studentId: cleanId(report.studentId),
    subjectLevels: cleanLevels(report.subjectLevels),
    personalSocialLevels: cleanLevels(report.personalSocialLevels),
    generalComment:
      typeof report.generalComment === "string"
        ? report.generalComment.trim()
        : "",
  }))
  if (
    reports.some(
      (report) =>
        !report.studentId ||
        !report.subjectLevels ||
        !report.personalSocialLevels ||
        report.generalComment.length > 3000
    ) ||
    new Set(reports.map((report) => report.studentId)).size !== reports.length
  ) {
    return { error: "One or more student reports contain invalid data." }
  }

  const studentIds = reports.map((report) => report.studentId)
  const [classMembers, subjects, aspects] = await Promise.all([
    db
      .select({ studentId: classMember.studentId })
      .from(classMember)
      .where(eq(classMember.classId, classId)),
    db.select({ id: subject.id }).from(subject),
    db.select({ id: personalSocialRubric.id }).from(personalSocialRubric),
  ])
  const validClassMemberIds = new Set(
    classMembers.map((member) => member.studentId)
  )
  const subjectIds = new Set(subjects.map((row) => row.id))
  const aspectIds = new Set(aspects.map((row) => row.id))
  if (
    studentIds.length !== validClassMemberIds.size ||
    studentIds.some((id) => !validClassMemberIds.has(id)) ||
    reports.some(
      (report) =>
        !sameIds(Object.keys(report.subjectLevels!), subjectIds) ||
        !sameIds(Object.keys(report.personalSocialLevels!), aspectIds)
    )
  ) {
    return { error: "Report contains invalid students or assessment items." }
  }

  try {
    const queries: BatchItem<"pg">[] = reports.map((report) =>
      db
        .insert(monthlyReport)
        .values({
          id: randomUUID(),
          studentId: report.studentId,
          classId,
          semester,
          month: input.month,
          year: input.year,
          subjectLevels: report.subjectLevels!,
          personalSocialLevels: report.personalSocialLevels!,
          generalComment: report.generalComment,
        })
        .onConflictDoUpdate({
          target: [
            monthlyReport.studentId,
            monthlyReport.year,
            monthlyReport.month,
          ],
          set: {
            classId,
            semester,
            subjectLevels: report.subjectLevels!,
            personalSocialLevels: report.personalSocialLevels!,
            generalComment: report.generalComment,
            updatedAt: new Date(),
          },
        })
    )
    if (queries.length > 0) {
      await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]])
    }
  } catch (error) {
    console.error("Failed to save monthly reports", error)
    return { error: "Could not save monthly reports." }
  }

  revalidatePath("/input-scores?reportType=monthly")
  return { success: "Monthly reports saved.", reports }
}

function cleanId(value: unknown) {
  return typeof value === "string" && value.trim().length <= 100
    ? value.trim()
    : ""
}

function cleanLevels(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const result: Record<string, string> = {}
  for (const [id, level] of Object.entries(value)) {
    const clean = cleanId(id)
    if (
      !clean ||
      typeof level !== "string" ||
      (level !== "" && !levels.includes(level))
    ) {
      return null
    }
    result[clean] = level
  }
  return result
}

function sameIds(ids: string[], expected: Set<string>) {
  return ids.length === expected.size && ids.every((id) => expected.has(id))
}
