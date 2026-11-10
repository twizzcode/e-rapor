import { relations } from "drizzle-orm"
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core"

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  role: text("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)]
)

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)]
)

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)]
)

export const teacher = pgTable("teacher", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  nip: text("nip").unique(),
  nuptk: text("nuptk").unique(),
  gender: text("gender"),
  ptkType: text("ptk_type"),
  birthDate: date("birth_date"),
  phone: text("phone"),
  address: text("address"),
  village: text("village"),
  district: text("district"),
  regency: text("regency"),
  province: text("province"),
  postalCode: text("postal_code"),
  signatureKey: text("signature_key"),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const schoolProfile = pgTable("school_profile", {
  id: text("id").primaryKey(),
  logoKey: text("logo_key"),
  foundationLogoKey: text("foundation_logo_key"),
  stampKey: text("stamp_key"),
  name: text("name").notNull(),
  educationLevel: text("education_level").notNull(),
  nss: text("nss"),
  npsn: text("npsn"),
  street: text("street"),
  village: text("village"),
  district: text("district"),
  regency: text("regency"),
  province: text("province"),
  postalCode: text("postal_code"),
  phoneFax: text("phone_fax"),
  email: text("email"),
  website: text("website"),
  principalUserId: text("principal_user_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const student = pgTable("student", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nisn: text("nisn").unique(),
  nis: text("nis").notNull().unique(),
  admissionDate: date("admission_date"),
  birthPlace: text("birth_place"),
  birthDate: date("birth_date"),
  gender: text("gender"),
  religion: text("religion"),
  street: text("street"),
  village: text("village"),
  district: text("district"),
  regency: text("regency"),
  province: text("province"),
  postalCode: text("postal_code"),
  familyStatus: text("family_status"),
  childOrder: integer("child_order"),
  previousSchool: text("previous_school"),
  admittedClass: text("admitted_class"),
  guardianName: text("guardian_name"),
  studentPhone: text("student_phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const classGroup = pgTable("class_group", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  cohortYear: integer("cohort_year").notNull(),
  homeroomTeacherId: text("homeroom_teacher_id").references(() => user.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const classMember = pgTable("class_member", {
  studentId: text("student_id")
    .primaryKey()
    .references(() => student.id, { onDelete: "cascade" }),
  classId: text("class_id")
    .notNull()
    .references(() => classGroup.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const subject = pgTable("subject", {
  id: text("id").primaryKey(),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const assessmentDescriptor = pgTable(
  "assessment_descriptor",
  {
    id: text("id").primaryKey(),
    subjectId: text("subject_id")
      .notNull()
      .references(() => subject.id, { onDelete: "cascade" }),
    level: text("level").notNull(),
    description: text("description").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("assessment_descriptor_subject_level_idx").on(
      table.subjectId,
      table.level
    ),
  ]
)

export const personalSocialRubric = pgTable("personal_social_rubric", {
  id: text("id").primaryKey(),
  aspect: text("aspect").notNull().unique(),
  exceeding: text("exceeding").notNull(),
  meeting: text("meeting").notNull(),
  developing: text("developing").notNull(),
  emerging: text("emerging").notNull(),
  position: integer("position").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const monthlyReport = pgTable(
  "monthly_report",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => student.id, { onDelete: "cascade" }),
    classId: text("class_id")
      .notNull()
      .references(() => classGroup.id, { onDelete: "cascade" }),
    semester: integer("semester").notNull(),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    subjectLevels: jsonb("subject_levels")
      .$type<Record<string, string>>()
      .notNull(),
    personalSocialLevels: jsonb("personal_social_levels")
      .$type<Record<string, string>>()
      .notNull(),
    generalComment: text("general_comment").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("monthly_report_student_period_idx").on(
      table.studentId,
      table.year,
      table.month
    ),
  ]
)

export const semesterReport = pgTable(
  "semester_report",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => student.id, { onDelete: "cascade" }),
    classId: text("class_id")
      .notNull()
      .references(() => classGroup.id, { onDelete: "cascade" }),
    semester: integer("semester").notNull(),
    year: integer("year").notNull(),
    subjectScores: jsonb("subject_scores")
      .$type<Record<string, number | null>>()
      .notNull(),
    personalSocialLevels: jsonb("personal_social_levels")
      .$type<Record<string, string>>()
      .notNull(),
    generalComment: text("general_comment").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("semester_report_student_period_idx").on(
      table.studentId,
      table.year,
      table.semester
    ),
  ]
)

export type TahsinTahfidzWeek = {
  dateRange: string
  tahfidzLines: number | null
  murojaahPages: number | null
  tahsinPages: number | null
  grade: "A" | "B" | "PB" | ""
}

export const tahsinTahfidzReport = pgTable(
  "tahsin_tahfidz_report",
  {
    id: text("id").primaryKey(),
    studentId: text("student_id")
      .notNull()
      .references(() => student.id, { onDelete: "cascade" }),
    classId: text("class_id")
      .notNull()
      .references(() => classGroup.id, { onDelete: "cascade" }),
    teacherId: text("teacher_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    semester: integer("semester").notNull(),
    month: integer("month").notNull(),
    year: integer("year").notNull(),
    levelCategory: text("level_category").notNull(),
    weeks: jsonb("weeks").$type<TahsinTahfidzWeek[]>().notNull(),
    targetAchievement: text("target_achievement").notNull(),
    overallPerformance: text("overall_performance").notNull(),
    teacherNotes: text("teacher_notes").notNull(),
    recommendation: text("recommendation").default("").notNull(),
    reportDate: date("report_date"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("tahsin_tahfidz_report_student_period_teacher_idx").on(
      table.studentId,
      table.year,
      table.month,
      table.semester,
      table.teacherId
    ),
  ]
)

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  teacher: one(teacher),
}))

export const teacherRelations = relations(teacher, ({ one }) => ({
  user: one(user, {
    fields: [teacher.userId],
    references: [user.id],
  }),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))
