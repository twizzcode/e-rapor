"use server"

import { randomUUID } from "node:crypto"

import { eq } from "drizzle-orm"
import { inArray } from "drizzle-orm"
import type { BatchItem } from "drizzle-orm/batch"
import { revalidatePath } from "next/cache"

import { db } from "@/db"
import { student } from "@/db/schema"
import { getSession } from "@/lib/session"

export type StudentFormState = {
  error?: string
  success?: string
  studentId?: string
}

const genders = ["male", "female"]
const religions = [
  "islam",
  "christian",
  "catholic",
  "hindu",
  "buddhist",
  "confucian",
  "other",
]
const familyStatuses = ["biological-child", "adopted-child"]

export type StudentGridRow = {
  id: string
  name: string
  nis: string
  nisn: string
  gender: string
  birthPlace: string
  birthDate: string
  className: string | null
}

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim()
}

function optionalText(formData: FormData, name: string) {
  return text(formData, name) || null
}

function isDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value))
}

function isNis(value: string) {
  return value.length <= 30 && /^\d+(?:\.\d+)*$/.test(value)
}

export async function saveStudent(
  _state: StudentFormState,
  formData: FormData
): Promise<StudentFormState> {
  const session = await getSession()
  if (!session || session.user.role !== "admin") {
    return { error: "Only an Admin Teacher can save student data." }
  }

  const id = optionalText(formData, "id") ?? randomUUID()
  const name = text(formData, "name")
  const nisn = optionalText(formData, "nisn")
  const nis = text(formData, "nis")
  const admissionDate = optionalText(formData, "admissionDate")
  const birthPlace = optionalText(formData, "birthPlace")
  const birthDate = optionalText(formData, "birthDate")
  const gender = optionalText(formData, "gender")
  const religion = optionalText(formData, "religion")
  const familyStatus = optionalText(formData, "familyStatus")
  const childOrderValue = text(formData, "childOrder")
  const guardianName = optionalText(formData, "guardianName")
  const street = optionalText(formData, "street")
  const village = optionalText(formData, "village")
  const district = optionalText(formData, "district")
  const regency = optionalText(formData, "regency")
  const province = optionalText(formData, "province")
  const postalCode = optionalText(formData, "postalCode")

  if (!name || !nis) {
    return { error: "Full Name and NIS are required." }
  }
  if (
    name.length > 200 ||
    (birthPlace?.length ?? 0) > 100 ||
    (guardianName?.length ?? 0) > 200 ||
    [street, village, district, regency, province].some(
      (value) => (value?.length ?? 0) > 250
    ) ||
    (postalCode?.length ?? 0) > 10
  ) {
    return { error: "One or more fields exceed the character limit." }
  }
  if ((nisn && !/^\d{4,20}$/.test(nisn)) || !isNis(nis)) {
    return {
      error:
        "NIS may contain digits and dot separators; NISN must be 4–20 digits if set.",
    }
  }
  if (
    (admissionDate && !isDate(admissionDate)) ||
    (birthDate && !isDate(birthDate))
  ) {
    return { error: "Enter valid admission and birth dates." }
  }
  if (gender && !genders.includes(gender)) {
    return { error: "Select a valid gender." }
  }
  if (religion && !religions.includes(religion))
    return { error: "Select a valid religion." }
  if (familyStatus && !familyStatuses.includes(familyStatus)) {
    return { error: "Select a valid family status." }
  }

  const childOrder = childOrderValue ? Number(childOrderValue) : null
  if (
    childOrderValue &&
    (!Number.isInteger(childOrder) ||
      childOrder === null ||
      childOrder < 1 ||
      childOrder > 50)
  ) {
    return { error: "Child order must be between 1 and 50." }
  }

  const values = {
    name,
    nisn,
    nis,
    admissionDate,
    birthPlace,
    birthDate,
    gender,
    religion,
    street,
    village,
    district,
    regency,
    province,
    postalCode,
    familyStatus,
    childOrder,
    previousSchool: optionalText(formData, "previousSchool"),
    admittedClass: optionalText(formData, "admittedClass"),
    guardianName,
    studentPhone: optionalText(formData, "studentPhone"),
  }

  try {
    const existing = await db.query.student.findFirst({
      columns: { id: true },
      where: eq(student.id, id),
    })

    if (existing) {
      await db.update(student).set(values).where(eq(student.id, id))
    } else {
      await db.insert(student).values({ id, ...values })
    }
  } catch (error) {
    console.error("Failed to save student", error)
    return { error: "Could not save student. NISN or NIS may already exist." }
  }

  revalidatePath("/students")
  revalidatePath(`/students/${id}`)
  return { success: "Student data saved.", studentId: id }
}

export async function saveStudents(
  inputRows: StudentGridRow[],
  deletedIds: string[]
) {
  const session = await getSession()
  if (!session || session.user.role !== "admin") {
    return { error: "Only an Admin Teacher can manage student data." }
  }
  if (
    !Array.isArray(inputRows) ||
    !Array.isArray(deletedIds) ||
    inputRows.length > 1000 ||
    deletedIds.length > 1000
  ) {
    return { error: "Too many students in one request." }
  }

  const rows = inputRows.map((row) => ({
    id: typeof row.id === "string" ? row.id.trim() : "",
    nis: typeof row.nis === "string" ? row.nis.trim() : "",
    nisn: typeof row.nisn === "string" ? row.nisn.trim() || null : null,
    gender: typeof row.gender === "string" ? row.gender || null : null,
    birthPlace:
      typeof row.birthPlace === "string" ? row.birthPlace.trim() || null : null,
    birthDate: typeof row.birthDate === "string" ? row.birthDate || null : null,
  }))
  const normalizedDeletedIds = deletedIds.map((id) =>
    typeof id === "string" ? id.trim() : ""
  )
  const requestedIds = [...rows.map((row) => row.id), ...normalizedDeletedIds]
  if (
    rows.some(
      (row) =>
        !row.id ||
        row.id.length > 100 ||
        !isNis(row.nis) ||
        (row.nisn !== null && !/^\d{4,20}$/.test(row.nisn)) ||
        (row.gender !== null && !genders.includes(row.gender)) ||
        (row.birthPlace?.length ?? 0) > 100 ||
        (row.birthDate !== null && !isDate(row.birthDate))
    ) ||
    normalizedDeletedIds.some((id) => !id || id.length > 100) ||
    new Set(requestedIds).size !== requestedIds.length ||
    new Set(rows.map((row) => row.nis)).size !== rows.length ||
    new Set(rows.map((row) => row.nisn).filter(Boolean)).size !==
      rows.filter((row) => row.nisn).length
  ) {
    return { error: "Enter valid, unique student data." }
  }

  const existingRows = requestedIds.length
    ? await db
        .select({ id: student.id })
        .from(student)
        .where(inArray(student.id, requestedIds))
    : []
  if (existingRows.length !== requestedIds.length) {
    return { error: "One or more student records are invalid." }
  }

  try {
    const queries: BatchItem<"pg">[] = normalizedDeletedIds.map((id) =>
      db.delete(student).where(eq(student.id, id))
    )
    for (const row of rows) {
      queries.push(
        db
          .update(student)
          .set({
            nis: row.nis,
            nisn: row.nisn,
            gender: row.gender,
            birthPlace: row.birthPlace,
            birthDate: row.birthDate,
          })
          .where(eq(student.id, row.id))
      )
    }
    if (queries.length) {
      await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]])
    }
  } catch (error) {
    console.error("Failed to save students", error)
    return { error: "Could not save students. NIS and NISN must be unique." }
  }

  revalidatePath("/students")
  for (const row of rows) revalidatePath(`/students/${row.id}`)
  return { success: "Student data saved." }
}
