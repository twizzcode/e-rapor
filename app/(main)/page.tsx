import Link from "next/link"
import Image from "next/image"
import type { LucideIcon } from "lucide-react"
import {
  BookOpenIcon,
  Building2Icon,
  FileTextIcon,
  GraduationCapIcon,
  UsersIcon,
} from "lucide-react"
import { and, count, eq, isNull, or } from "drizzle-orm"
import { headers } from "next/headers"
import type { Metadata } from "next"

import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { db } from "@/db"
import {
  classGroup,
  monthlyReport,
  schoolProfile,
  semesterReport,
  student,
  subject,
  teacher,
  user,
} from "@/db/schema"

export const metadata: Metadata = {
  title: "Dashboard",
  description: "School report overview.",
}
import { auth } from "@/lib/auth"
import { createR2DownloadUrl } from "@/lib/r2"

export default async function DashboardPage() {
  const now = new Date()
  const month = now.getMonth() + 1
  const calendarYear = now.getFullYear()
  const semester = month >= 7 ? 1 : 2
  const academicYearStart = month >= 7 ? calendarYear : calendarYear - 1
  const [
    session,
    school,
    [students],
    [teachers],
    [classes],
    [subjects],
    [monthlyReports],
    [semesterReports],
  ] = await Promise.all([
    auth.api.getSession({ headers: await headers() }),
    db.query.schoolProfile.findFirst({
      columns: { name: true, educationLevel: true, logoKey: true },
      where: eq(schoolProfile.id, "main"),
    }),
    db.select({ value: count() }).from(student),
    db
      .select({ value: count() })
      .from(user)
      .leftJoin(teacher, eq(teacher.userId, user.id))
      .where(
        and(
          or(eq(user.role, "teacher"), eq(user.role, "admin")),
          or(eq(teacher.active, true), isNull(teacher.active))
        )
      ),
    db.select({ value: count() }).from(classGroup),
    db.select({ value: count() }).from(subject),
    db
      .select({ value: count() })
      .from(monthlyReport)
      .where(
        and(
          eq(monthlyReport.month, month),
          eq(monthlyReport.year, calendarYear)
        )
      ),
    db
      .select({ value: count() })
      .from(semesterReport)
      .where(
        and(
          eq(semesterReport.semester, semester),
          eq(semesterReport.year, academicYearStart)
        )
      ),
  ])
  const logoUrl = school?.logoKey
    ? await createR2DownloadUrl(school.logoKey, 3600)
    : "/logo.png"
  const studentCount = students.value
  const monthName = new Intl.DateTimeFormat("en", { month: "long" }).format(now)
  const statistics: Statistic[] = [
    {
      label: "Students",
      value: studentCount,
      description: "Registered students",
      icon: UsersIcon,
      className: "bg-blue-700 text-white",
    },
    {
      label: "Active Teachers",
      value: teachers.value,
      description: "Teacher accounts",
      icon: GraduationCapIcon,
      className: "bg-emerald-700 text-white",
    },
    {
      label: "Classes",
      value: classes.value,
      description: "Current class groups",
      icon: Building2Icon,
      className: "bg-amber-600 text-white",
    },
    {
      label: "Subjects",
      value: subjects.value,
      description: "Assessment subjects",
      icon: BookOpenIcon,
      className: "bg-violet-700 text-white",
    },
  ]
  const reportProgress = [
    {
      label: "Monthly Reports",
      period: `${monthName} ${calendarYear}`,
      count: monthlyReports.value,
    },
    {
      label: "Semester Reports",
      period: `Semester ${semester} · ${academicYearStart}/${academicYearStart + 1}`,
      count: semesterReports.value,
    },
  ]

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <section className="flex flex-col gap-5 border bg-card p-6 sm:flex-row sm:items-center">
        <Image
          src={logoUrl}
          alt={`${school?.name ?? "School"} logo`}
          width={64}
          height={64}
          unoptimized
          className="size-16 shrink-0 object-contain"
        />
        <div>
          <p className="text-xs font-medium tracking-wide text-primary uppercase">
            Welcome back, {session?.user.name ?? "Teacher"}
          </p>
          <h1 className="mt-1 font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            {school?.name ?? "School Dashboard"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage scores and export student reports from one place.
          </p>
        </div>
      </section>

      <section>
        <h2 className="font-heading text-lg font-medium">School Overview</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Current data from {school?.educationLevel || "school records"}.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {statistics.map((statistic) => {
            const Icon = statistic.icon
            return (
              <div
                key={statistic.label}
                className={`flex min-h-28 items-center justify-between p-4 shadow-sm ${statistic.className}`}
              >
                <div>
                  <p className="text-xs font-medium text-white/75">
                    {statistic.label}
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">
                    {statistic.value}
                  </p>
                  <p className="mt-1 text-xs text-white/70">
                    {statistic.description}
                  </p>
                </div>
                <Icon className="size-6 text-white/80" />
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Report Progress</CardTitle>
            <CardDescription>
              Saved reports for current reporting periods.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {reportProgress.map((report) => {
              const percentage = studentCount
                ? Math.min(100, Math.round((report.count / studentCount) * 100))
                : 0
              return (
                <div key={report.label} className="border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{report.label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {report.period}
                      </p>
                    </div>
                    <span className="text-lg font-semibold">
                      {report.count}/{studentCount}
                    </span>
                  </div>
                  <div className="mt-4 h-2 bg-muted" aria-hidden="true">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {percentage}% saved
                  </p>
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Continue common report tasks.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link
              href="/input-scores?reportType=monthly"
              className={buttonVariants({ className: "justify-start" })}
            >
              <FileTextIcon />
              Monthly Report
            </Link>
            <Link
              href="/input-scores?reportType=semester"
              className={buttonVariants({
                variant: "outline",
                className: "justify-start",
              })}
            >
              <FileTextIcon />
              Semester Report
            </Link>
            {session?.user.role === "admin" && (
              <>
                <Link
                  href="/students"
                  className={buttonVariants({
                    variant: "outline",
                    className: "justify-start",
                  })}
                >
                  <UsersIcon />
                  Manage Students
                </Link>
                <Link
                  href="/classes"
                  className={buttonVariants({
                    variant: "outline",
                    className: "justify-start",
                  })}
                >
                  <Building2Icon />
                  Manage Classes
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

type Statistic = {
  label: string
  value: number
  description: string
  icon: LucideIcon
  className: string
}
