import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Reports",
  description: "Open school reports.",
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    reportType?: string
    classId?: string
    semester?: string
    month?: string
    year?: string
  }>
}) {
  const params = await searchParams
  const query = new URLSearchParams()
  query.set(
    "reportType",
    params.reportType === "semester" ? "semester" : "monthly"
  )
  for (const key of ["classId", "semester", "month", "year"] as const) {
    const value = params[key]
    if (value) query.set(key, value)
  }
  redirect(`/input-scores?${query}`)
}
