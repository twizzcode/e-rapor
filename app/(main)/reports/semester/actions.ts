"use server"

import { randomUUID } from "node:crypto"

import { eq } from "drizzle-orm"
import type { BatchItem } from "drizzle-orm/batch"
import { revalidatePath } from "next/cache"

import { db } from "@/db"
import {
  classMember,
  personalSocialRubric,
  semesterReport,
  subject,
} from "@/db/schema"
import { getSession } from "@/lib/session"

export type BulkSemesterReportRow = {
  studentId: string
  subjectScores: Record<string, number | null>
  personalSocialLevels: Record<string, string>
  generalComment: string
}

export type BulkSemesterReportInput = {
  classId: string
  semester: number
  year: number
  reports: BulkSemesterReportRow[]
}

const levels = ["Exceeding", "Meeting", "Developing", "Emerging"]

export async function saveSemesterReports(input: BulkSemesterReportInput) {
  const session = await getSession()
  if (
    !session ||
    (session.user.role !== "teacher" && session.user.role !== "admin")
  ) {
    return { error: "Only teachers can update reports." }
  }

  const classId = cleanId(input.classId)
  if (
    !classId ||
    ![1, 2].includes(input.semester) ||
    !Number.isInteger(input.year) ||
    input.year < 2020 ||
    input.year > 2100 ||
    !Array.isArray(input.reports) ||
    input.reports.length > 200
  ) {
    return { error: "Invalid report data." }
  }

  const reports = input.reports.map((report) => ({
    studentId: cleanId(report.studentId),
    subjectScores: cleanScores(report.subjectScores),
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
        !report.subjectScores ||
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
  const classMemberIds = new Set(classMembers.map((row) => row.studentId))
  const subjectIds = new Set(subjects.map((row) => row.id))
  const aspectIds = new Set(aspects.map((row) => row.id))
  if (
    classMemberIds.size > 200 ||
    studentIds.length !== classMemberIds.size ||
    studentIds.some((id) => !classMemberIds.has(id)) ||
    reports.some(
      (report) =>
        !sameIds(Object.keys(report.subjectScores!), subjectIds) ||
        !sameIds(Object.keys(report.personalSocialLevels!), aspectIds)
    )
  ) {
    return { error: "Report contains invalid students or assessment items." }
  }

  try {
    const queries: BatchItem<"pg">[] = reports.map((report) =>
      db
        .insert(semesterReport)
        .values({
          id: randomUUID(),
          studentId: report.studentId,
          classId,
          semester: input.semester,
          year: input.year,
          subjectScores: report.subjectScores!,
          personalSocialLevels: report.personalSocialLevels!,
          generalComment: report.generalComment,
        })
        .onConflictDoUpdate({
          target: [
            semesterReport.studentId,
            semesterReport.year,
            semesterReport.semester,
          ],
          set: {
            classId,
            subjectScores: report.subjectScores!,
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
    console.error("Failed to save semester reports", error)
    return { error: "Could not save semester reports." }
  }

  revalidatePath("/input-scores?reportType=semester")
  return { success: "Semester reports saved.", reports }
}

function cleanId(value: unknown) {
  return typeof value === "string" && value.trim().length <= 100
    ? value.trim()
    : ""
}

function cleanScores(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  const result: Record<string, number | null> = {}
  for (const [id, score] of Object.entries(value)) {
    const clean = cleanId(id)
    if (
      !clean ||
      (score !== null &&
        (typeof score !== "number" ||
          !Number.isInteger(score) ||
          score < 0 ||
          score > 100))
    ) {
      return null
    }
    result[clean] = score
  }
  return result
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
