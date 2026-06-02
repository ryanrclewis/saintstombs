/**
 * Smoke test: parse then serialize each region file and report diffs.
 * Run: node scripts/test-roundtrip.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const regionsDir = path.resolve(__dirname, '../content/saints/regions')

// ── Inline the parser/serializer (avoid TS import issues in plain mjs) ────────

const SAINT_REGEX = /(st\.|saint|bl\.|blessed|venerable|servant of god)/i

const TITLE_PATTERNS = [
  { re: /^Servant of God\s+/i, title: 'Servant of God' },
  { re: /^Venerable\s+/i, title: 'Venerable' },
  { re: /^Blessed\s+/i, title: 'Blessed' },
  { re: /^Saint\s+/i, title: 'Saint' },
  { re: /^Ven\.\s*/i, title: 'Ven.' },
  { re: /^Bl\.\s*/i, title: 'Bl.' },
  { re: /^St\.\s*/i, title: 'St.' },
]

let _id = 0
function uid() { return String(++_id) }

function parseSaintLine(text) {
  let notes = ''
  const notesMatch = text.match(/\s*\(([^)]*)\)\s*$/)
  if (notesMatch) {
    notes = notesMatch[1].trim()
    text = text.slice(0, text.length - notesMatch[0].length).trimEnd()
  }
  let title = 'St.'
  let rest = text
  for (const { re, title: t } of TITLE_PATTERNS) {
    const m = text.match(re)
    if (m) { title = t; rest = text.slice(m[0].length); break }
  }
  const commaIdx = rest.indexOf(',')
  if (commaIdx === -1) return { id: uid(), title, name: rest.trim(), role: '', feastDay: '', notes, rawLine: '' }
  const name = rest.slice(0, commaIdx).trim()
  const afterName = rest.slice(commaIdx + 1).trim()
  const feastMatch = afterName.match(/\b(\d{1,2}\/\d{1,2})\b/)
  if (!feastMatch) return { id: uid(), title, name, role: afterName, feastDay: '', notes, rawLine: '' }
  const feastIdx = feastMatch.index
  const role = afterName.slice(0, feastIdx).replace(/,\s*$/, '').trim()
  const feastDay = afterName.slice(feastIdx).trim()
  return { id: uid(), title, name, role, feastDay, notes, rawLine: '' }
}

function rawSaint(rawLine) { return { id: uid(), title: 'St.', name: '', role: '', feastDay: '', notes: '', rawLine } }

function parseRegionsMarkdown(markdown) {
  const lines = markdown.split(/\r?\n/)
  let hasExplicitCountryHeadings = false
  const countries = []
  let currentCountry = { id: uid(), name: '', locations: [] }
  let currentLocation = null
  let currentBuilding = null

  function flushBuilding() {
    if (currentBuilding && currentLocation) { currentLocation.buildings.push(currentBuilding); currentBuilding = null }
  }
  function flushLocation() {
    flushBuilding()
    if (currentLocation) { currentCountry.locations.push(currentLocation); currentLocation = null }
  }
  function flushCountry() {
    flushLocation()
    if (currentCountry.locations.length > 0 || currentCountry.name) countries.push(currentCountry)
    currentCountry = { id: uid(), name: '', locations: [] }
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const h1 = line.match(/^#\s+(.+)/)
    if (h1) { flushCountry(); hasExplicitCountryHeadings = true; currentCountry = { id: uid(), name: h1[1].trim(), locations: [] }; continue }
    if (line.trim() === '') continue
    const l2 = line.match(/^(\s{2,}|\t)-\s+(.+)/)
    if (l2) {
      const content = l2[2].trim()
      if (!currentBuilding) currentBuilding = { id: uid(), name: '???', saints: [] }
      currentBuilding.saints.push(SAINT_REGEX.test(content) ? parseSaintLine(content) : rawSaint(content))
      continue
    }
    const l1 = line.match(/^-\s+(.+)/)
    if (l1) {
      const content = l1[1].trim()
      if (SAINT_REGEX.test(content)) {
        if (!currentBuilding) currentBuilding = { id: uid(), name: '???', saints: [] }
        const saintText = content.replace(/^\?\?\?/, '').trim()
        currentBuilding.saints.push(parseSaintLine(saintText || content))
      } else {
        flushBuilding()
        currentBuilding = { id: uid(), name: content, saints: [] }
      }
      continue
    }
    const hh = line.match(/^#{2,}\s+(.+)/)
    if (hh) { flushBuilding(); flushLocation(); currentLocation = { id: uid(), name: hh[1].trim(), buildings: [] }; continue }
    if (line.length > 0 && line.length < 200) { flushBuilding(); flushLocation(); currentLocation = { id: uid(), name: line.trim(), buildings: [] }; continue }
    if (currentBuilding) {
      const last = currentBuilding.saints[currentBuilding.saints.length - 1]
      if (last && last.rawLine) last.rawLine += '\n' + line
      else currentBuilding.saints.push(rawSaint(line))
    }
  }
  flushCountry()
  if (countries.length === 0) countries.push({ id: uid(), name: '', locations: [] })
  return { hasExplicitCountryHeadings, countries }
}

function serializeSaint(saint) {
  if (saint.rawLine) return `  - ${saint.rawLine}`
  let line = `  - ${saint.title} ${saint.name}`
  if (saint.role) line += `, ${saint.role}`
  if (saint.feastDay) line += `, ${saint.feastDay}`
  if (saint.notes) line += ` (${saint.notes})`
  return line
}

function serializeRegionsDocument(doc) {
  const parts = []
  let firstContent = true
  for (const country of doc.countries) {
    if (doc.hasExplicitCountryHeadings) {
      if (!firstContent) parts.push('')
      parts.push(`# ${country.name}`)
      firstContent = false
    }
    for (const location of country.locations) {
      if (!firstContent) parts.push('')
      parts.push(location.name)
      firstContent = false
      for (const building of location.buildings) {
        parts.push('')
        parts.push(`- ${building.name}`)
        for (const saint of building.saints) parts.push(serializeSaint(saint))
      }
    }
  }
  return parts.join('\n') + '\n'
}

// ── Run tests ─────────────────────────────────────────────────────────────────

const files = (await fs.readdir(regionsDir))
  .filter(f => f.endsWith('.md') && !['README.md', 'about.md', 'donate.md'].includes(f))
  .sort()

let totalSaints = 0
let rawLines = 0

for (const file of files) {
  const original = await fs.readFile(path.join(regionsDir, file), 'utf8')
  const doc = parseRegionsMarkdown(original)
  const serialized = serializeRegionsDocument(doc)

  // Count saints and raw lines
  const allSaints = doc.countries.flatMap(c => c.locations.flatMap(l => l.buildings.flatMap(b => b.saints)))
  totalSaints += allSaints.length
  const raw = allSaints.filter(s => s.rawLine).length
  rawLines += raw

  // Compare line counts as a proxy for round-trip quality
  const origLines = original.split('\n').filter(l => l.trim()).length
  const serLines = serialized.split('\n').filter(l => l.trim()).length
  const diff = serLines - origLines
  const status = Math.abs(diff) <= 2 ? '✅' : diff > 0 ? '⚠️ +extra' : '⚠️ -missing'

  console.log(`${status} ${file.padEnd(30)} orig=${origLines} ser=${serLines} diff=${diff > 0 ? '+' : ''}${diff} saints=${allSaints.length} raw=${raw}`)
}

console.log(`\nTotal saints parsed: ${totalSaints}`)
console.log(`Raw (unparseable) lines: ${rawLines}`)
