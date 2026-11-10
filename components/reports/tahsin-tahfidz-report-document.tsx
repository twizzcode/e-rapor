import Image from "next/image"

import type { TahsinTahfidzWeek } from "@/db/schema"
import { totalTahfidzLines } from "@/lib/tahsin-tahfidz"

type Signer = {
  name: string
  nip: string | null
  signatureUrl: string | null
}

export function TahsinTahfidzReportDocument({
  classGroup,
  grade,
  teacher,
  semester,
  month,
  year,
  students,
}: {
  classGroup: { name: string }
  grade: number
  teacher: Signer
  semester: number
  month: number
  year: number
  students: {
    id: string
    name: string
    levelCategory: string
    weeks: TahsinTahfidzWeek[]
    targetAchievement: string
    overallPerformance: string
    teacherNotes: string
    reportDate: string | null
  }[]
}) {
  const period = new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1))

  return (
    <div className="tahsin-report-document">
      {students.map((student) => {
        const totalLines = totalTahfidzLines(student.weeks)
        return (
          <article key={student.id} className="tahsin-report-page">
            <h1>Tahsin &amp; Tahfidz Learning Report</h1>

            <ReportSection title="Student Identity">
              <Identity label="Student Name" value={student.name} />
              <Identity
                label="Class/Grade"
                value={`${classGroup.name} / ${grade}`}
              />
              <Identity
                label="Semester"
                value={semester === 2 ? "II (Two)" : "I (One)"}
              />
              <Identity label="Tahfidz Teacher" value={teacher.name} />
              <ChoiceLine
                label="Level Category"
                selected={student.levelCategory}
                options={["Advanced", "Intermediate", "Basic"]}
              />
            </ReportSection>

            <ReportSection title="Memorization Target (Based on Level)">
              <Identity label="Advanced" value="3–4 lines/day" />
              <Identity label="Intermediate" value="2–3 lines/day" />
              <Identity label="Basic" value="1–2 lines/day" />
            </ReportSection>

            <ReportSection title="Weekly Grade Scale">
              <p>A = Excellent | B = Good | PB = Needs Intensive Guidance</p>
            </ReportSection>

            <ReportSection title="Weekly Achievement Recap (Tahsin & Tahfidz)">
              <table className="tahsin-week-table">
                <thead>
                  <tr>
                    <th rowSpan={2}>Week</th>
                    <th rowSpan={2}>Date Range</th>
                    <th colSpan={2}>Tahfidz</th>
                    <th rowSpan={2}>Tahsin (Page)</th>
                    <th rowSpan={2}>Grade</th>
                  </tr>
                  <tr>
                    <th>Total Lines</th>
                    <th>Murojaah (Page)</th>
                  </tr>
                </thead>
                <tbody>
                  {student.weeks.map((week, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>{week.dateRange || "—"}</td>
                      <td>{displayNumber(week.tahfidzLines)}</td>
                      <td>{displayNumber(week.murojaahPages)}</td>
                      <td>{displayNumber(week.tahsinPages)}</td>
                      <td>{week.grade || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ReportSection>

            <ReportSection title="4-Week Summary">
              <Identity
                label="Total Lines Memorized (Hifz)"
                value={`${totalLines} lines in ${period}`}
              />
              <ChoiceLine
                label="Average Target Achievement"
                selected={student.targetAchievement}
                options={["Meets Target", "Above Target", "Below Target"]}
              />
              <ChoiceLine
                label="Overall Performance"
                selected={student.overallPerformance}
                options={[
                  "A (Excellent)",
                  "B (Good)",
                  "PB (Needs Intensive Guidance)",
                ]}
                values={["A", "B", "PB"]}
              />
            </ReportSection>

            <ReportSection title="Teacher’s Notes (Tahsin & Tahfidz)">
              <p className="tahsin-notes">{student.teacherNotes || "—"}</p>
            </ReportSection>

            <footer className="tahsin-report-footer">
              <div className="report-signature report-homeroom-signature">
                <p>Teacher Signature:</p>
                <div className="report-signature-image">
                  {teacher.signatureUrl && (
                    <Image
                      src={teacher.signatureUrl}
                      alt="Tahfidz teacher signature"
                      width={120}
                      height={60}
                      unoptimized
                    />
                  )}
                </div>
                <strong>( {teacher.name} )</strong>
                {teacher.nip && <small>NIP. {teacher.nip}</small>}
              </div>
              <p>Date: {formatDate(student.reportDate)}</p>
            </footer>
          </article>
        )
      })}
    </div>
  )
}

function ReportSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="tahsin-report-section">
      <h2>{title}</h2>
      {children}
    </section>
  )
}

function Identity({ label, value }: { label: string; value: string }) {
  return (
    <p className="tahsin-identity-row">
      <span>{label}</span>
      <span>:</span>
      <strong>{value}</strong>
    </p>
  )
}

function ChoiceLine({
  label,
  selected,
  options,
  values = options,
}: {
  label: string
  selected: string
  options: string[]
  values?: string[]
}) {
  return (
    <p className="tahsin-choice-row">
      <span>{label}</span>
      <span>:</span>
      <span>
        {options.map((option, index) => (
          <span key={option} className="tahsin-choice">
            {selected === values[index] ? "☒" : "☐"} {option}
          </span>
        ))}
      </span>
    </p>
  )
}

function displayNumber(value: number | null) {
  return value === null ? "—" : value
}

function formatDate(value: string | null) {
  if (!value) return "—"
  const [year, month, day] = value.split("-")
  return `${day} / ${month} / ${year}`
}
