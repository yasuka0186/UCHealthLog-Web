const DATE_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

function padTwoDigits(value: number): string {
  return String(value).padStart(2, '0')
}

/** Generates a calendar key from local date fields without a UTC conversion. */
export function toDateKey(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('有効な日付を指定してください。')
  }

  const year = date.getFullYear()
  if (year < 0 || year > 9999) {
    throw new RangeError('dateKeyで表現できる年を指定してください。')
  }

  return [
    String(year).padStart(4, '0'),
    padTwoDigits(date.getMonth() + 1),
    padTwoDigits(date.getDate()),
  ].join('-')
}

export function isValidDateKey(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false
  }

  const match = DATE_KEY_PATTERN.exec(value)
  if (!match) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const localDate = new Date(0)
  localDate.setHours(0, 0, 0, 0)
  localDate.setFullYear(year, month - 1, day)

  return (
    localDate.getFullYear() === year &&
    localDate.getMonth() === month - 1 &&
    localDate.getDate() === day
  )
}
