import { redirect } from "next/navigation"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Assessment",
  description: "Open subject assessments.",
}

export default function AssessmentPage() {
  redirect("/subjects")
}
