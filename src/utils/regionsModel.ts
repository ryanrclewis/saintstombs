export type SaintTitle =
  | 'St.'
  | 'Bl.'
  | 'Ven.'
  | 'Saint'
  | 'Blessed'
  | 'Venerable'
  | 'Servant of God'

export const SAINT_TITLES: SaintTitle[] = [
  'St.',
  'Bl.',
  'Ven.',
  'Saint',
  'Blessed',
  'Venerable',
  'Servant of God',
]

export interface SaintEntry {
  id: string
  title: SaintTitle
  name: string      // "Patrick of Armagh"
  role: string      // "bishop, martyr"
  feastDay: string  // raw text: "7/24" or "8/13 or 8/31" or "10/11, 8/1"
  notes: string     // stripped from trailing parens: "relics only"
  rawLine: string   // non-empty = unparseable; serializer emits verbatim
}

export interface Building {
  id: string
  name: string      // "Cathedral", "Abbey", "???" for unknown
  saints: SaintEntry[]
}

export interface Location {
  id: string
  name: string      // "Armagh" or "Assisi, Umbria"
  buildings: Building[]
}

export interface CountrySection {
  id: string
  name: string      // from # heading, or '' for implicit-from-filename files
  locations: Location[]
}

export interface RegionDocument {
  hasExplicitCountryHeadings: boolean  // false = ireland.md style (no H1s)
  countries: CountrySection[]
}

// ── Factory helpers ───────────────────────────────────────────────────────────

function uid(): string {
  return crypto.randomUUID()
}

export function newSaint(overrides: Partial<SaintEntry> = {}): SaintEntry {
  return { id: uid(), title: 'St.', name: '', role: '', feastDay: '', notes: '', rawLine: '', ...overrides }
}

export function newBuilding(name = ''): Building {
  return { id: uid(), name, saints: [newSaint()] }
}

export function newLocation(name = ''): Location {
  return { id: uid(), name, buildings: [newBuilding('???')] }
}

export function newCountry(name = ''): CountrySection {
  return { id: uid(), name, locations: [newLocation()] }
}
