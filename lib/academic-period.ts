export const MAX_GRADE = 6
export const SEMESTERS_PER_GRADE = 2
export const MAX_SEMESTER = MAX_GRADE * SEMESTERS_PER_GRADE

export type SemesterInYear = 1 | 2

/**
 * The academic year starts in July. January–June still belongs to the
 * academic year that started in the previous calendar year.
 */
export function getAcademicYearStart(calendarYear: number, month: number) {
  return month >= 7 ? calendarYear : calendarYear - 1
}

export function getSemesterInYear(month: number): SemesterInYear {
  return month >= 7 ? 1 : 2
}

export function getGradeForAcademicYear(
  cohortYear: number,
  academicYearStart: number
) {
  return academicYearStart - cohortYear + 1
}

export function getSemesterNumber(
  cohortYear: number,
  academicYearStart: number,
  semester: SemesterInYear
) {
  return (academicYearStart - cohortYear) * SEMESTERS_PER_GRADE + semester
}

export function getAcademicPeriodFromSemesterNumber(
  cohortYear: number,
  semesterNumber: number
) {
  const offset = Math.floor((semesterNumber - 1) / SEMESTERS_PER_GRADE)
  return {
    academicYearStart: cohortYear + offset,
    semesterInYear: (semesterNumber % 2 === 1 ? 1 : 2) as SemesterInYear,
    grade: offset + 1,
    semesterNumber,
  }
}

export function getAcademicPeriodFromDate(
  cohortYear: number,
  calendarYear: number,
  month: number
) {
  const academicYearStart = getAcademicYearStart(calendarYear, month)
  const semesterInYear = getSemesterInYear(month)
  return {
    academicYearStart,
    semesterInYear,
    grade: getGradeForAcademicYear(cohortYear, academicYearStart),
    semesterNumber: getSemesterNumber(
      cohortYear,
      academicYearStart,
      semesterInYear
    ),
  }
}

export function getCurrentAcademicPeriod(
  cohortYear: number,
  date: Date = new Date()
) {
  return getAcademicPeriodFromDate(
    cohortYear,
    date.getFullYear(),
    date.getMonth() + 1
  )
}

export function formatAcademicYear(academicYearStart: number) {
  return `${academicYearStart}/${academicYearStart + 1}`
}

export function isValidGrade(grade: number) {
  return Number.isInteger(grade) && grade >= 1 && grade <= MAX_GRADE
}
