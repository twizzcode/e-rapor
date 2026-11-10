import "server-only"

import { and, asc, eq, isNull, or } from "drizzle-orm"

import { db } from "@/db"
import { teacher, user } from "@/db/schema"

export function getActiveTeacherOptions() {
  return db
    .select({ id: user.id, name: user.name, nip: teacher.nip })
    .from(user)
    .leftJoin(teacher, eq(teacher.userId, user.id))
    .where(
      and(
        or(eq(user.role, "teacher"), eq(user.role, "admin")),
        or(eq(teacher.active, true), isNull(teacher.active))
      )
    )
    .orderBy(asc(user.name))
}
