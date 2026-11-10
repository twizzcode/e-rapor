"use server"

import { randomUUID } from "node:crypto"

import type { BatchItem } from "drizzle-orm/batch"
import { and, desc, eq, inArray, isNull, or } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { db } from "@/db"
import { classGroup, classMember, student, teacher, user } from "@/db/schema"
import { auth } from "@/lib/auth"

export type ClassFormState = {
  error?: string
  success?: string
  classId?: string
}

export type ClassGridRow = {
  id: string
  name: string
  gradeLevel: string
  homeroomTeacherId: string
  homeroomTeacher: string
  studentCount: number
}

async function isAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user.role === "admin"
}

export async function saveClass(
  _state: ClassFormState,
  formData: FormData
): Promise<ClassFormState> {
  if (!(await isAdmin())) {
    return { error: "Only an Admin Teacher can save class data." }
  }

  const id = String(formData.get("id") ?? "").trim() || randomUUID()
  const name = String(formData.get("name") ?? "").trim()
  const gradeLevel = Number(formData.get("gradeLevel"))
  const homeroomTeacherId =
    String(formData.get("homeroomTeacherId") ?? "").trim() || null

  if (!name || name.length > 100) return { error: "Enter a valid class name." }
  if (!Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 6) {
    return { error: "Grade level must be between 1 and 6." }
  }

  if (homeroomTeacherId) {
    const [homeroomTeacher] = await db
      .select({ id: user.id })
      .from(user)
      .leftJoin(teacher, eq(teacher.userId, user.id))
      .where(
        and(
          eq(user.id, homeroomTeacherId),
          or(eq(user.role, "teacher"), eq(user.role, "admin")),
          or(eq(teacher.active, true), isNull(teacher.active))
        )
      )
      .limit(1)

    if (!homeroomTeacher) return { error: "Select a valid active teacher." }
  }

  try {
    const existing = await db.query.classGroup.findFirst({
      columns: { id: true },
      where: eq(classGroup.id, id),
    })

    if (existing) {
      await db
        .update(classGroup)
        .set({ name, gradeLevel, homeroomTeacherId })
        .where(eq(classGroup.id, id))
      await syncClassStudentLabels(id, name, gradeLevel)
    } else {
      await db
        .insert(classGroup)
        .values({ id, name, gradeLevel, homeroomTeacherId })
    }
  } catch (error) {
    console.error("Failed to save class", error)
    return { error: "Could not save class. Class name may already exist." }
  }

  revalidateClassPaths(id)
  return { success: "Class data saved.", classId: id }
}

export async function deleteClass(id: string) {
  if (!(await isAdmin())) {
    return { error: "Only an Admin Teacher can delete classes." }
  }
  if (!id || id.length > 100) return { error: "Invalid class ID." }

  try {
    const memberIds = await db
      .select({ studentId: classMember.studentId })
      .from(classMember)
      .where(eq(classMember.classId, id))

    await db.delete(classGroup).where(eq(classGroup.id, id))
    for (const member of memberIds) {
      await db
        .update(student)
        .set({ gradeLevel: null, className: null })
        .where(eq(student.id, member.studentId))
    }
  } catch (error) {
    console.error("Failed to delete class", error)
    return { error: "Could not delete class." }
  }

  revalidatePath("/classes")
  revalidatePath("/students")
  return { success: "Class deleted." }
}

export async function saveClasses(
  inputRows: ClassGridRow[],
  deletedIds: string[]
) {
  if (!(await isAdmin())) {
    return { error: "Only an Admin Teacher can manage classes." }
  }
  if (
    !Array.isArray(inputRows) ||
    !Array.isArray(deletedIds) ||
    inputRows.length > 100 ||
    deletedIds.length > 100
  ) {
    return { error: "Too many classes in one request." }
  }

  const rows = inputRows.map((row) => ({
    id: cleanId(row.id),
    name: typeof row.name === "string" ? row.name.trim() : "",
    gradeLevel: Number(row.gradeLevel),
    homeroomTeacherId: cleanId(row.homeroomTeacherId) || null,
    studentCount: Number(row.studentCount) || 0,
  }))
  const normalizedDeletedIds = deletedIds.map(cleanId)
  if (
    rows.some(
      (row) =>
        !row.id ||
        !row.name ||
        row.name.length > 100 ||
        !Number.isInteger(row.gradeLevel) ||
        row.gradeLevel < 1 ||
        row.gradeLevel > 6
    ) ||
    normalizedDeletedIds.some((id) => !id) ||
    new Set(rows.map((row) => row.id)).size !== rows.length ||
    new Set(rows.map((row) => row.name.toLocaleLowerCase())).size !==
      rows.length
  ) {
    return { error: "Enter valid, unique class names and grade levels 1–6." }
  }

  const teacherIds = new Set(
    rows
      .map((row) => row.homeroomTeacherId)
      .filter((id): id is string => Boolean(id))
  )
  if (teacherIds.size) {
    const activeTeachers = await db
      .select({ id: user.id })
      .from(user)
      .leftJoin(teacher, eq(teacher.userId, user.id))
      .where(
        and(
          or(eq(user.role, "teacher"), eq(user.role, "admin")),
          or(eq(teacher.active, true), isNull(teacher.active))
        )
      )
    const validTeacherIds = new Set(activeTeachers.map((row) => row.id))
    if ([...teacherIds].some((id) => !validTeacherIds.has(id))) {
      return { error: "Select valid active homeroom teachers." }
    }
  }

  try {
    const deletedMembers = normalizedDeletedIds.length
      ? await db
          .select({ studentId: classMember.studentId })
          .from(classMember)
          .where(inArray(classMember.classId, normalizedDeletedIds))
      : []
    const queries: BatchItem<"pg">[] = []
    for (const id of normalizedDeletedIds) {
      queries.push(db.delete(classGroup).where(eq(classGroup.id, id)))
    }
    for (const row of rows) {
      queries.push(
        db
          .insert(classGroup)
          .values({
            id: row.id,
            name: row.name,
            gradeLevel: row.gradeLevel,
            homeroomTeacherId: row.homeroomTeacherId,
          })
          .onConflictDoUpdate({
            target: classGroup.id,
            set: {
              name: row.name,
              gradeLevel: row.gradeLevel,
              homeroomTeacherId: row.homeroomTeacherId,
              updatedAt: new Date(),
            },
          })
      )
    }
    if (queries.length) {
      await db.batch(queries as [BatchItem<"pg">, ...BatchItem<"pg">[]])
    }
    if (deletedMembers.length) {
      await db
        .update(student)
        .set({ gradeLevel: null, className: null })
        .where(
          inArray(
            student.id,
            deletedMembers.map((row) => row.studentId)
          )
        )
    }
    for (const row of rows) {
      await syncClassStudentLabels(row.id, row.name, row.gradeLevel)
    }
  } catch (error) {
    console.error("Failed to save classes", error)
    return { error: "Could not save classes. Class names must be unique." }
  }

  revalidatePath("/classes")
  revalidatePath("/students")
  return {
    success: "Class data saved.",
    rows: rows.map((row) => ({
      ...row,
      gradeLevel: String(row.gradeLevel),
      homeroomTeacher: "",
    })),
  }
}

export async function addClassMembers(classId: string, studentIds: string[]) {
  if (!(await isAdmin())) {
    return { error: "Only an Admin Teacher can manage class members." }
  }
  const normalizedStudentIds = [
    ...new Set(Array.isArray(studentIds) ? studentIds.map(cleanId) : []),
  ]
  if (
    !cleanId(classId) ||
    normalizedStudentIds.length === 0 ||
    normalizedStudentIds.length > 500 ||
    normalizedStudentIds.some((id) => !id)
  ) {
    return { error: "Select valid students." }
  }

  const [targetClass, availableStudents, lastMember] = await Promise.all([
    db.query.classGroup.findFirst({ where: eq(classGroup.id, classId) }),
    db
      .select({ id: student.id })
      .from(student)
      .leftJoin(classMember, eq(classMember.studentId, student.id))
      .where(
        and(
          inArray(student.id, normalizedStudentIds),
          isNull(classMember.studentId)
        )
      ),
    db
      .select({ position: classMember.position })
      .from(classMember)
      .where(eq(classMember.classId, classId))
      .orderBy(desc(classMember.position))
      .limit(1),
  ])
  if (
    !targetClass ||
    availableStudents.length !== normalizedStudentIds.length
  ) {
    return { error: "One or more students already belong to a class." }
  }

  try {
    await db.batch([
      db.insert(classMember).values(
        normalizedStudentIds.map((studentId, index) => ({
          classId,
          studentId,
          position: (lastMember[0]?.position ?? 0) + index + 1,
        }))
      ),
      db
        .update(student)
        .set({
          gradeLevel: String(targetClass.gradeLevel),
          className: targetClass.name,
        })
        .where(inArray(student.id, normalizedStudentIds)),
    ])
  } catch (error) {
    console.error("Failed to add class members", error)
    return { error: "Could not add students. Refresh and try again." }
  }

  revalidateClassPaths(classId)
  return {
    success: `${normalizedStudentIds.length} student${normalizedStudentIds.length === 1 ? "" : "s"} added to class.`,
  }
}

export async function removeClassMember(classId: string, studentId: string) {
  if (!(await isAdmin())) {
    return { error: "Only an Admin Teacher can manage class members." }
  }
  if (
    !classId ||
    !studentId ||
    classId.length > 100 ||
    studentId.length > 100
  ) {
    return { error: "Invalid class or student ID." }
  }

  try {
    await db.batch([
      db
        .delete(classMember)
        .where(
          and(
            eq(classMember.classId, classId),
            eq(classMember.studentId, studentId)
          )
        ),
      db
        .update(student)
        .set({ gradeLevel: null, className: null })
        .where(eq(student.id, studentId)),
    ])
  } catch (error) {
    console.error("Failed to remove class member", error)
    return { error: "Could not remove student from class." }
  }

  revalidateClassPaths(classId)
  return { success: "Student removed from class." }
}

async function syncClassStudentLabels(
  id: string,
  name: string,
  gradeLevel: number
) {
  const members = await db
    .select({ studentId: classMember.studentId })
    .from(classMember)
    .where(eq(classMember.classId, id))

  for (const member of members) {
    await db
      .update(student)
      .set({ gradeLevel: String(gradeLevel), className: name })
      .where(eq(student.id, member.studentId))
  }
}

function revalidateClassPaths(id: string) {
  revalidatePath("/classes")
  revalidatePath(`/classes/${id}`)
  revalidatePath("/students")
}

function cleanId(value: unknown) {
  return typeof value === "string" && value.trim().length <= 100
    ? value.trim()
    : ""
}
