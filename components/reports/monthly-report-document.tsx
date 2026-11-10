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

export function MonthlyReportDocument({
  school,
  classGroup,
  grade,
  period,
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
  classGroup: { name: string }
  grade: number
  period: string
  subjects: RubricItem[]
  aspects: RubricItem[]
  students: {
    id: string
    name: string
    subjectLevels: Record<string, string>
    personalSocialLevels: Record<string, string>
    generalComment: string
  }[]
  homeroomTeacher: Signer | null
  principal: Signer | null
}) {
  return (
    <div className="monthly-report-document">
      {students.map((student) => (
        <article
          key={student.id}
          className="monthly-report-page"
          data-report-page
          data-student-name={student.name}
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

          <h2>Monthly Student Report</h2>
          <dl className="report-identity">
            <div>
              <dt>Name</dt>
              <dd>: {student.name}</dd>
            </div>
            <div>
              <dt>Grade</dt>
              <dd>: {grade}</dd>
            </div>
            <div>
              <dt>Class</dt>
              <dd>: {classGroup.name}</dd>
            </div>
            <div>
              <dt>Month / Period</dt>
              <dd>: {period}</dd>
            </div>
          </dl>

          <ReportSection title="Academic Performance">
            <table>
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>*Level</th>
                  <th>Descriptive</th>
                </tr>
              </thead>
              <tbody>
                {subjects.map((subject) => {
                  const level = student.subjectLevels[subject.id] as Level
                  return (
                    <tr key={subject.id}>
                      <td>{subject.name}</td>
                      <td>{level}</td>
                      <td>{subject.descriptions[level] || "—"}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </ReportSection>

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

          <ReportSection title="Personal & Social Development">
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
          </ReportSection>

          <ReportSection title="General Comment">
            <p className="report-comment">{student.generalComment || "—"}</p>
          </ReportSection>

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

function ReportSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="report-section">
      <h3>{title}</h3>
      {children}
    </section>
  )
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
