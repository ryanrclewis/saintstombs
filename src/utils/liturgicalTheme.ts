export type LiturgicalColor = 'green' | 'purple' | 'white' | 'red' | 'rose'

export type LiturgicalTheme = {
  color: LiturgicalColor
  label: string
}

function toDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

function startOfAdvent(year: number): Date {
  // First Sunday on or after November 27.
  const candidate = new Date(year, 10, 27)
  const offset = (7 - candidate.getDay()) % 7
  return addDays(candidate, offset)
}

function calculateEasterSunday(year: number): Date {
  // Meeus/Jones/Butcher Gregorian algorithm.
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function isInRange(target: Date, start: Date, end: Date): boolean {
  return target.getTime() >= start.getTime() && target.getTime() <= end.getTime()
}

export function getLiturgicalTheme(inputDate: Date): LiturgicalTheme {
  const date = toDateOnly(inputDate)
  const year = date.getFullYear()

  const easter = calculateEasterSunday(year)
  const ashWednesday = addDays(easter, -46)
  const palmSunday = addDays(easter, -7)
  const holyThursday = addDays(easter, -3)
  const goodFriday = addDays(easter, -2)
  const pentecost = addDays(easter, 49)

  const adventCurrentYear = startOfAdvent(year)
  const adventPreviousYear = startOfAdvent(year - 1)
  const christmasStartCurrentYear = new Date(year, 11, 25)
  const christmasStartPreviousYear = new Date(year - 1, 11, 25)
  const baptismOfLord = new Date(year, 0, 13)

  // Rose Sunday approximations: Gaudete (Advent 3) and Laetare (Lent 4).
  const gaudeteSunday = addDays(adventCurrentYear, 14)
  const laetareSunday = addDays(ashWednesday, 25)
  if (date.getTime() === gaudeteSunday.getTime() || date.getTime() === laetareSunday.getTime()) {
    return { color: 'rose', label: 'Rose Sunday' }
  }

  if (isInRange(date, ashWednesday, addDays(palmSunday, -1))) {
    return { color: 'purple', label: 'Lent' }
  }

  if (date.getTime() === palmSunday.getTime() || date.getTime() === goodFriday.getTime()) {
    return { color: 'red', label: 'Passion' }
  }

  if (isInRange(date, holyThursday, addDays(easter, -1))) {
    return { color: 'white', label: 'Triduum' }
  }

  if (isInRange(date, easter, addDays(pentecost, -1))) {
    return { color: 'white', label: 'Easter' }
  }

  if (date.getTime() === pentecost.getTime()) {
    return { color: 'red', label: 'Pentecost' }
  }

  if (isInRange(date, adventCurrentYear, addDays(christmasStartCurrentYear, -1))) {
    return { color: 'purple', label: 'Advent' }
  }

  if (isInRange(date, christmasStartCurrentYear, new Date(year + 1, 0, 12))) {
    return { color: 'white', label: 'Christmas' }
  }

  if (isInRange(date, christmasStartPreviousYear, baptismOfLord)) {
    return { color: 'white', label: 'Christmas' }
  }

  if (isInRange(date, adventPreviousYear, addDays(christmasStartPreviousYear, -1))) {
    return { color: 'purple', label: 'Advent' }
  }

  return { color: 'green', label: 'Ordinary Time' }
}
