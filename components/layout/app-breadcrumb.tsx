"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

type BreadcrumbEntry = { label: string; href?: string }

export function AppBreadcrumb() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const entries = getBreadcrumbs(pathname, searchParams.get("reportType"))

  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList className="flex-nowrap justify-center overflow-hidden">
        {entries.map((entry, index) => {
          const current = index === entries.length - 1
          return (
            <React.Fragment key={`${entry.label}-${index}`}>
              {index > 0 && <BreadcrumbSeparator className="shrink-0" />}
              <BreadcrumbItem className="min-w-0">
                {current || !entry.href ? (
                  <BreadcrumbPage className="truncate">
                    {entry.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={<Link href={entry.href} />}
                    className="truncate"
                  >
                    {entry.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

function getBreadcrumbs(
  pathname: string,
  reportType: string | null
): BreadcrumbEntry[] {
  const home: BreadcrumbEntry = { label: "Dashboard", href: "/" }
  if (pathname === "/") return [{ label: "Dashboard" }]

  if (pathname === "/input-scores") {
    return [
      home,
      {
        label: reportType === "semester" ? "Semester Report" : "Monthly Report",
      },
    ]
  }
  if (pathname === "/reports") {
    return [
      home,
      {
        label: reportType === "semester" ? "Semester Report" : "Monthly Report",
      },
    ]
  }
  if (pathname === "/reports/monthly/export") {
    return [
      home,
      {
        label: "Monthly Report",
        href: "/input-scores?reportType=monthly",
      },
      { label: "Preview" },
    ]
  }
  if (pathname === "/reports/semester/export") {
    return [
      home,
      {
        label: "Semester Report",
        href: "/input-scores?reportType=semester",
      },
      { label: "Preview" },
    ]
  }
  if (pathname === "/reports/tahsin-tahfidz") {
    return [home, { label: "Tahsin Tahfidz Report" }]
  }
  if (pathname === "/reports/tahsin-tahfidz/export") {
    return [
      home,
      {
        label: "Tahsin Tahfidz Report",
        href: "/reports/tahsin-tahfidz",
      },
      { label: "Preview" },
    ]
  }

  const segments = pathname.split("/").filter(Boolean)
  const root = segments[0]
  const rootLabel = routeLabels[root] ?? titleCase(root)
  const rootHref = `/${root}`
  const entries: BreadcrumbEntry[] = [home]

  if (segments.length === 1) {
    entries.push({ label: rootLabel })
    return entries
  }

  entries.push({ label: rootLabel, href: rootHref })
  if (segments[1] === "new") {
    entries.push({ label: "Add New" })
    return entries
  }

  if (segments.length > 2 && segments[2] === "edit") {
    entries.push({ label: "Details", href: `${rootHref}/${segments[1]}` })
    entries.push({ label: "Edit" })
    return entries
  }

  entries.push({ label: "Details" })
  return entries
}

const routeLabels: Record<string, string> = {
  "school-profile": "School Profile",
  "school-assets": "School Assets",
  teachers: "Teachers",
  students: "Students",
  classes: "Classes",
  subjects: "Subjects",
  "personal-social": "Personal & Social",
  profile: "My Profile",
  assessment: "Assessment",
  reports: "Reports",
}

function titleCase(value: string) {
  return value
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ")
}
