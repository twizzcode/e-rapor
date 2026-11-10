export function totalTahfidzLines(
  weeks: readonly { tahfidzLines: number | null }[]
) {
  return weeks.reduce((total, week) => total + (week.tahfidzLines ?? 0), 0)
}
