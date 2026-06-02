import type { SaintTitle, SaintEntry, Building, Location, CountrySection, RegionDocument } from './regionsModel'
import { newSaint } from './regionsModel'

const SAINT_REGEX = /(st\.|saint|bl\.|blessed|venerable|servant of god)/i

// Ordered from longest prefix to shortest to avoid false matches
const TITLE_PATTERNS: Array<{ re: RegExp; title: SaintTitle }> = [
  { re: /^Servant of God\s+/i, title: 'Servant of God' },
  { re: /^Venerable\s+/i, title: 'Venerable' },
  { re: /^Blessed\s+/i, title: 'Blessed' },
  { re: /^Saint\s+/i, title: 'Saint' },
  { re: /^Ven\.\s*/i, title: 'Ven.' },
  { re: /^Bl\.\s*/i, title: 'Bl.' },
  { re: /^St\.\s*/i, title: 'St.' },
]

function uid(): string {
  return crypto.randomUUID()
}

// ── Saint line parser ─────────────────────────────────────────────────────────

function parseSaintLine(text: string): SaintEntry {
  const base = newSaint()

  // 1. Strip trailing parenthetical note: e.g. "(relics only)"
  let notes = ''
  const notesMatch = text.match(/\s*\(([^)]*)\)\s*$/)
  if (notesMatch) {
    notes = notesMatch[1].trim()
    text = text.slice(0, text.length - notesMatch[0].length).trimEnd()
  }

  // 2. Detect title prefix
  let title: SaintTitle = 'St.'
  let rest = text
  for (const { re, title: t } of TITLE_PATTERNS) {
    const m = text.match(re)
    if (m) {
      title = t
      rest = text.slice(m[0].length)
      break
    }
  }

  // 3. Split on first comma → name / (role + feastDay)
  const commaIdx = rest.indexOf(',')
  if (commaIdx === -1) {
    return { ...base, title, name: rest.trim(), notes }
  }

  const name = rest.slice(0, commaIdx).trim()
  const afterName = rest.slice(commaIdx + 1).trim()

  // 4. Find first feast day pattern (M/D or MM/DD) → role ends just before it
  const feastMatch = afterName.match(/\b(\d{1,2}\/\d{1,2})\b/)
  if (!feastMatch || feastMatch.index === undefined) {
    return { ...base, title, name, role: afterName, feastDay: '', notes }
  }

  const feastIdx = feastMatch.index
  const role = afterName.slice(0, feastIdx).replace(/,\s*$/, '').trim()
  const feastDay = afterName.slice(feastIdx).trim()

  return { ...base, title, name, role, feastDay, notes }
}

function rawSaint(rawLine: string): SaintEntry {
  return { ...newSaint(), rawLine }
}

// ── Main parser ───────────────────────────────────────────────────────────────

export function parseRegionsMarkdown(markdown: string): RegionDocument {
  const lines = markdown.split(/\r?\n/)

  let hasExplicitCountryHeadings = false
  const countries: CountrySection[] = []

  let currentCountry: CountrySection = { id: uid(), name: '', locations: [] }
  let currentLocation: Location | null = null
  let currentBuilding: Building | null = null

  function flushBuilding() {
    if (currentBuilding && currentLocation) {
      currentLocation.buildings.push(currentBuilding)
      currentBuilding = null
    }
  }

  function flushLocation() {
    flushBuilding()
    if (currentLocation) {
      currentCountry.locations.push(currentLocation)
      currentLocation = null
    }
  }

  function flushCountry() {
    flushLocation()
    if (currentCountry.locations.length > 0 || currentCountry.name) {
      countries.push(currentCountry)
    }
    currentCountry = { id: uid(), name: '', locations: [] }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()

    // ── H1 heading → new country ──────────────────────────
    const h1Match = line.match(/^#\s+(.+)/)
    if (h1Match) {
      flushCountry()
      hasExplicitCountryHeadings = true
      currentCountry = { id: uid(), name: h1Match[1].trim(), locations: [] }
      continue
    }

    // ── Blank line → skip ─────────────────────────────────
    if (line.trim() === '') continue

    // ── Level-2+ indented bullet (saint entry) ────────────
    const level2Match = line.match(/^(\s{2,}|\t)-\s+(.+)/)
    if (level2Match) {
      const content = level2Match[2].trim()
      if (!currentBuilding) {
        currentBuilding = { id: uid(), name: '???', saints: [] }
      }
      if (SAINT_REGEX.test(content)) {
        currentBuilding.saints.push(parseSaintLine(content))
      } else {
        currentBuilding.saints.push(rawSaint(content))
      }
      continue
    }

    // ── Level-1 bullet ────────────────────────────────────
    const level1Match = line.match(/^-\s+(.+)/)
    if (level1Match) {
      const content = level1Match[1].trim()

      if (SAINT_REGEX.test(content)) {
        // Inline saint (e.g. "- ???St. Brendan of Birr, 11/29")
        if (!currentBuilding) {
          currentBuilding = { id: uid(), name: '???', saints: [] }
        }
        // Strip leading ??? if present
        const saintText = content.replace(/^\?\?\?/, '').trim()
        currentBuilding.saints.push(parseSaintLine(saintText || content))
      } else {
        // Building name
        flushBuilding()
        currentBuilding = { id: uid(), name: content, saints: [] }
      }
      continue
    }

    // ── Higher headings (##–######) → skip as location ───
    const higherHeading = line.match(/^#{2,}\s+(.+)/)
    if (higherHeading) {
      // treat as location for now (edge case)
      flushBuilding()
      flushLocation()
      currentLocation = { id: uid(), name: higherHeading[1].trim(), buildings: [] }
      continue
    }

    // ── Plain text line → location name ──────────────────
    if (line.length > 0 && line.length < 200) {
      flushBuilding()
      flushLocation()
      currentLocation = { id: uid(), name: line.trim(), buildings: [] }
      continue
    }

    // ── Fallback → store as raw saint entry ──────────────
    if (currentBuilding) {
      // Append to last saint rawLine if it exists and has rawLine set, else push new
      const last = currentBuilding.saints[currentBuilding.saints.length - 1]
      if (last && last.rawLine) {
        last.rawLine += '\n' + line
      } else {
        currentBuilding.saints.push(rawSaint(line))
      }
    } else if (currentLocation) {
      // Orphan line — attach to implicit building
      if (!currentBuilding) {
        currentBuilding = { id: uid(), name: '???', saints: [] }
      }
      currentBuilding.saints.push(rawSaint(line))
    }
  }

  // Flush remaining state
  flushCountry()

  // If nothing was found, return an empty document
  if (countries.length === 0) {
    countries.push({ id: uid(), name: '', locations: [] })
  }

  return { hasExplicitCountryHeadings, countries }
}
