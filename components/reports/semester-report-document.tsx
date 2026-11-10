import Image from "next/image"

type Level = "Exceeding" | "Meeting" | "Developing" | "Emerging"

type RubricItem = {
  id: string
  name: string
  descriptions: Record<Level, string>
}

type Signer = {
  name: string
  nip: string | null
  signatureUrl: string | null
}

export function SemesterReportDocument({
  school,
  classGroup,
  academicYear,
  semester,
  subjects,
  aspects,
  students,
  homeroomTeacher,
  principal,
}: {
  school: {
    name: string
    address: string
    logoUrl: string | null
    foundationLogoUrl: string | null
    stampUrl: string | null
  }
  classGroup: { name: string; gradeLevel: number }
  academicYear: string
  semester: number
  subjects: RubricItem[]
  aspects: RubricItem[]
  students: {
    id: string
    name: string
    subjectScores: Record<string, number | null>
    personalSocialLevels: Record<string, string>
    generalComment: string
  }[]
  homeroomTeacher: Signer | null
  principal: Signer | null
}) {
  const period = `${semester === 1 ? "First" : "Second"} Semester ${academicYear}`

  return (
    <div className="monthly-report-document">
      {students.map((student) => (
        <article
          key={student.id}
          className="monthly-report-page semester-report-page"
        >
          <header className="report-header">
            <ReportImage
              src={school.foundationLogoUrl}
              alt="Foundation logo"
              className="report-foundation-logo"
            />
            <div>
              <h1>{school.name}</h1>
              <p>{school.address}</p>
            </div>
            <ReportImage
              src={school.logoUrl}
              alt="School logo"
              className="report-school-logo"
            />
          </header>

          <h2>Student Report - Academic Year {academicYear}</h2>
          <dl className="report-identity semester-report-identity">
            <div>
              <dt>Name</dt>
              <dd>: {student.name}</dd>
            </div>
            <div>
              <dt>Grade</dt>
              <dd>: {classGroup.gradeLevel}</dd>
            </div>
            <div>
              <dt>Period</dt>
              <dd>: {period}</dd>
            </div>
          </dl>

          <section className="report-section semester-academic-section">
            <h3>Academic Performance</h3>
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Score</th>
                  <th>*Level</th>
                  <th>Descriptive</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => {
                  const score = student.subjectScores[subject.id]
                  const level = scoreLevel(score)
                  return (
                    <tr key={subject.id}>
                      <td>{subject.name}</td>
                      <td>{score ?? "—"}</td>
                      <td>{level ?? "—"}</td>
                      <td>
                        {level ? subject.descriptions[level] || "—" : "—"}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>

          <div className="report-level-legend">
            <strong>*Level Description</strong>
            <LevelDescription level="Exceeding">
              Melebihi harapan (90–100)
            </LevelDescription>
            <LevelDescription level="Meeting">
              Sesuai harapan (80–89)
            </LevelDescription>
            <LevelDescription level="Developing">
              Sedang berkembang (70–79)
            </LevelDescription>
            <LevelDescription level="Emerging">
              Baru mulai (&lt;70)
            </LevelDescription>
          </div>

          <section className="report-section">
            <h3>Personal &amp; Social Development</h3>
            <table>
              <thead>
                <tr>
                  <th>Aspect</th>
                  <th>Comment</th>
                </tr>
              </thead>
              <tbody>
                {aspects.map((aspect) => {
                  const level = student.personalSocialLevels[aspect.id] as Level
                  return (
                    <tr key={aspect.id}>
                      <td>{aspect.name}</td>
                      <td>{aspect.descriptions[level] || "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </section>

          <section className="report-section">
            <h3>General Comment</h3>
            <p className="report-comment">{student.generalComment || "—"}</p>
          </section>

          <footer className="report-signatures">
            <Signature
              title="Homeroom Teacher"
              signer={homeroomTeacher}
              className="report-homeroom-signature"
            />
            <div className="report-principal-signature">
              <Signature
                title="Principal"
                signer={principal}
                className="report-principal-signature-content"
              />
              {school.stampUrl && (
                <Image
                  src={school.stampUrl}
                  alt="School stamp"
                  width={90}
                  height={90}
                  unoptimized
                  className="report-stamp"
                />
              )}
            </div>
          </footer>
        </article>
      ))}
    </div>
  )
}

function scoreLevel(score: number | null | undefined): Level | null {
  if (score === null || score === undefined) return null
  if (score >= 90) return "Exceeding"
  if (score >= 80) return "Meeting"
  if (score >= 70) return "Developing"
  return "Emerging"
}

function LevelDescription({
  level,
  children,
}: {
  level: Level
  children: React.ReactNode
}) {
  return (
    <span className="report-level-item">
      <span>{level}</span>
      <span>:</span>
      <span>{children}</span>
    </span>
  )
}

function ReportImage({
  src,
  alt,
  className,
}: {
  src: string | null
  alt: string
  className: string
}) {
  return src ? (
    <Image
      src={src}
      alt={alt}
      width={64}
      height={64}
      unoptimized
      className={className}
    />
  ) : (
    <span
      className={`report-image-placeholder ${className}`}
      aria-hidden="true"
    />
  )
}

function Signature({
  title,
  signer,
  className,
}: {
  title: string
  signer: Signer | null
  className: string
}) {
  return (
    <div className={`report-signature ${className}`}>
      <p>{title},</p>
      <div className="report-signature-image">
        {signer?.signatureUrl && (
          <Image
            src={signer.signatureUrl}
            alt={`${title} signature`}
            width={120}
            height={60}
            unoptimized
          />
        )}
      </div>
      <strong>( {signer?.name ?? "—"} )</strong>
      {signer?.nip && <small>NIP. {signer.nip}</small>}
    </div>
  )
}
