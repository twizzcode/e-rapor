"use server"

import { and, eq, inArray, sql } from "drizzle-orm"
import { revalidatePath } from "next/cache"

import { db } from "@/db"
import { teacher, user } from "@/db/schema"
import { getSession } from "@/lib/session"

export type TeacherRow = {
  id: string
  fullName: string
  email: string
  status: "Active" | "Inactive"
  role: "Teacher" | "Admin Teacher"
}

export async function addTeacherByEmail(email: string): Promise<{
  error?: string
  success?: string
  teacher?: TeacherRow
}> {
  const session = await getSession()
  if (!session || session.user.role !== "admin") {
    return { error: "Only an Admin Teacher can add teachers." }
  }

  const normalizedEmail =
    typeof email === "string" ? email.trim().toLowerCase() : ""
  if (
    normalizedEmail.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)
  ) {
    return { error: "Enter a valid email address." }
  }

  const [account] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    })
    .from(user)
    .where(sql`lower(${user.email}) = ${normalizedEmail}`)
    .limit(1)

  if (!account) {
    return {
      error:
        "Account not found. Ask this user to sign in once, then try again.",
    }
  }
  if (account.role === "teacher" || account.role === "admin") {
    return { error: "This account is already in the teacher list." }
  }

  try {
    await db.batch([
      db.update(user).set({ role: "teacher" }).where(eq(user.id, account.id)),
      db
        .insert(teacher)
        .values({ userId: account.id, active: true })
        .onConflictDoUpdate({
          target: teacher.userId,
          set: { active: true, updatedAt: new Date() },
        }),
    ])
  } catch (error) {
    console.error("Failed to add teacher", error)
    return { error: "Could not add teacher." }
  }

  const addedTeacher: TeacherRow = {
    id: account.id,
    fullName: account.name,
    email: account.email,
    status: "Active",
    role: "Teacher",
  }

  revalidatePath("/teachers")
  revalidatePath("/access-denied")
  return {
    success: `${account.name} can now access the dashboard.`,
    teacher: addedTeacher,
  }
}

export async function saveTeachers(rows: TeacherRow[], deletedIds: string[]) {
  const session = await getSession()
  if (!session || session.user.role !== "admin") {
    return { error: "Only an Admin Teacher can change teacher data." }
  }

  if (rows.length > 500 || deletedIds.length > 500) {
    return { error: "Too many records in one request." }
  }

  const rowIds = new Set(rows.map((row) => row.id))
  if (
    rowIds.size !== rows.length ||
    new Set(deletedIds).size !== deletedIds.length ||
    deletedIds.some((id) => rowIds.has(id)) ||
    rows.some(
      (row) =>
        !row.id ||
        !["Active", "Inactive"].includes(row.status) ||
        !["Teacher", "Admin Teacher"].includes(row.role)
    )
  ) {
    return { error: "Invalid teacher data." }
  }

  if (deletedIds.includes(session.user.id)) {
    return { error: "Admin Teachers cannot remove their own access." }
  }

  const requestedIds = [...rowIds, ...deletedIds]
  const existingAccounts = requestedIds.length
    ? await db
        .select({ id: user.id })
        .from(user)
        .where(
          and(
            inArray(user.id, requestedIds),
            inArray(user.role, ["teacher", "admin"])
          )
        )
    : []
  if (existingAccounts.length !== requestedIds.length) {
    return { error: "One or more teacher accounts are invalid." }
  }

  try {
    for (const row of rows) {
      const role = row.role === "Admin Teacher" ? "admin" : "teacher"

      await db.batch([
        db.update(user).set({ role }).where(eq(user.id, row.id)),
        db
          .insert(teacher)
          .values({ userId: row.id, active: row.status === "Active" })
          .onConflictDoUpdate({
            target: teacher.userId,
            set: { active: row.status === "Active", updatedAt: new Date() },
          }),
      ])
    }

    for (const id of deletedIds) {
      await db.batch([
        db
          .insert(teacher)
          .values({ userId: id, active: false })
          .onConflictDoUpdate({
            target: teacher.userId,
            set: { active: false, updatedAt: new Date() },
          }),
        db.update(user).set({ role: "user" }).where(eq(user.id, id)),
      ])
    }
  } catch (error) {
    console.error("Failed to save teachers", error)
    return { error: "Could not save teacher data." }
  }

  revalidatePath("/teachers")
  return { success: "Teacher data saved." }
}
