import type { SaintTitle, SaintEntry, Building, Location, CountrySection, RegionDocument } from './regionsModel.ts'
import { newSaint } from './regionsModel.ts'

export const SAINT_REGEX =
  /\b(?:st\.|ss\.|bl\.|bls\.|ven\.|(?:saint|blessed|venerable|servants?\s+of\s+god)\b)/i

// Ordered from longest prefix to shortest to avoid false matches
const TITLE_PATTERNS: Array<{ re: RegExp; title: SaintTitle }> = [
  { re: /^Servants of God\s+/i, title: 'Servants of God' },
  { re: /^Servant of God\s+/i, title: 'Servant of God' },
  { re: /^Venerable\s+/i, title: 'Venerable' },
  { re: /^Blessed\s+/i, title: 'Blessed' },
  { re: /^Saint\s+/i, title: 'Saint' },
  { re: /^Ven\.\s*/i, title: 'Ven.' },
  { re: /^Bls\.\s*/i, title: 'Bls.' },
  { re: /^Bl\.\s*/i, title: 'Bl.' },
  { re: /^Ss\.\s*/i, title: 'Ss.' },
  { re: /^St\.\s*/i, title: 'St.' },
]

const TITLE_START_RE =
  /^(?:\?\?\?\s*)?(?:st\.|ss\.|bl\.|bls\.|ven\.|(?:saint|blessed|venerable|servants?\s+of\s+god)(?=\s))/i

const NON_SAINT_BUILDING_WORD_RE =
  /\b(church|cathedral|basilica|chapel|abbey|monastery|priory|cemetery|convent|shrine|parish|hospital|sanctuary|duomo|chiesa|iglesia|église|eglise|kirche|kapelle|kloster|cattedrale|abbaye|basilique|cimetière|cimetiere|forane|college|school|minster|oratory|hermitage|tomb|crypt|ruins|castle|retreat)\b|եկեղեցի|վանք|պള്ളി|صومعة|كنيسة/i

const SAINT_DATE_RE = /\b\d{1,2}\/\d{1,2}\b/
const SAINT_ORDER_RE = /,\s*(?:[A-Z]{2,5}\b|O\.[A-Z])/
const SAINT_ROLE_RE =
  /,\s*(?:d\.|bishop|archbishop|martyr|priest|abbot|abbess|monk|nun|friar|lay|confessor|virgin|hermit|missionary|church father|founder|foundress|religious|cardinal|pope|deacon|subdeacon|king|queen|prince|princess|widow|pilgrim|catechist|mystic|superior|brother|sister|doctor|evangelist|apostle|disciple|patriarch|catholicos|eparch|vicar|canon|prelate|scholar|theologian|author|mother|father|soldier|physician|hieromonk|nobleman|general)/i
const SAINT_RELIC_PAREN_RE =
  /\((?:[^)]*(?:relic|skull|hand|arm|head|body|bone|incorrupt|tomb|grave|vestment|shrine|possibly at|disputed|buried))/i

const HANGING_LINE_END_RE =
  /(?:,|['’]s|\b(?:of|the|and|in|at|to|for|by|from|with|di|de|del|della|da|du|des|la|le|el|or|is|was|were|be|his|her|their|its|a|an))\s*$/i

function uid(): string {
  return crypto.randomUUID()
}

function hasUnclosedParens(text: string): boolean {
  let depth = 0
  for (const ch of text) {
    if (ch === '(') depth++
    else if (ch === ')' && depth > 0) depth--
  }
  return depth > 0
}

function findTopLevelComma(text: string): number {
  let depth = 0
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch === '(') depth++
    else if (ch === ')' && depth > 0) depth--
    else if (ch === ',' && depth === 0) return i
  }
  return -1
}

function isInlineLevel1Saint(content: string, nextIsLevel2: boolean): boolean {
  if (!TITLE_START_RE.test(content)) return false
  // Two-column appendix lines (e.g. "St. Albans Abbey        St. Alban & ...") are not single saints
  if (/\s{3,}/.test(content)) return false

  const mainPart = content.replace(/\([^)]*\)/g, ' ').trim()
  const beforeFirstComma = mainPart.split(',')[0] ?? mainPart
  if (NON_SAINT_BUILDING_WORD_RE.test(beforeFirstComma)) return false

  // Possessive building names without biographical dates/roles (e.g. "St. Paul's Retreat, Mount Argus")
  if (/['’]s\b/.test(beforeFirstComma) && !SAINT_DATE_RE.test(content) && !SAINT_ROLE_RE.test(content)) {
    return false
  }

  // Explicit ??? + title or Bl. / Ven. / Servant of God (already filtered for building words)
  if (/^(?:\?\?\?\s*|(?:bl\.|bls\.|ven\.|blessed\s|venerable\s|servants?\s+of\s+god\s))/i.test(content)) {
    return true
  }

  if (
    SAINT_DATE_RE.test(content) ||
    SAINT_ROLE_RE.test(content) ||
    SAINT_ORDER_RE.test(content) ||
    SAINT_RELIC_PAREN_RE.test(content)
  ) {
    return true
  }

  return !nextIsLevel2 && findTopLevelComma(mainPart) !== -1
}

// ── Logical line unwrapping ───────────────────────────────────────────────────

type LineKind =
  | 'h1'
  | 'heading'
  | 'bold'
  | 'l1'
  | 'l2'
  | 'unicodeBullet'
  | 'footnote'
  | 'plain'

interface LogicalLine {
  kind: LineKind
  text: string
}

function unwrapMarkdownLines(markdown: string): LogicalLine[] {
  const rawLines = markdown.split(/\r?\n/)
  const out: LogicalLine[] = []
  let prevKind: LineKind | 'blank' = 'blank'

  for (const rawLine of rawLines) {
    const trimmedEnd = rawLine.trimEnd()
    const trimmed = trimmedEnd.trim()

    if (trimmed === '') {
      prevKind = 'blank'
      continue
    }

    if (/^#\s+/.test(trimmedEnd)) {
      out.push({ kind: 'h1', text: trimmedEnd })
      prevKind = 'h1'
      continue
    }

    if (/^#{2,6}\s+/.test(trimmedEnd)) {
      out.push({ kind: 'heading', text: trimmedEnd })
      prevKind = 'heading'
      continue
    }

    if (/^\[\^[^\]]+\]:/.test(trimmed)) {
      out.push({ kind: 'footnote', text: trimmed })
      prevKind = 'footnote'
      continue
    }

    if (/^\*\*[^*]+\*\*$/.test(trimmed)) {
      out.push({ kind: 'bold', text: trimmed })
      prevKind = 'bold'
      continue
    }

    if (/^(\s{2,}|\t)-\s*\S/.test(trimmedEnd)) {
      out.push({ kind: 'l2', text: trimmedEnd })
      prevKind = 'l2'
      continue
    }

    if (/^-\s*(?:\S|$)/.test(trimmedEnd)) {
      out.push({ kind: 'l1', text: trimmedEnd })
      prevKind = 'l1'
      continue
    }

    const isIndented = /^\s+/.test(trimmedEnd)
    const isUnicodeBullet = /^\s*•\s*/.test(trimmedEnd)

    if (isUnicodeBullet) {
      if (prevKind === 'l1' && out.length > 0 && /^-\s*$/.test(out[out.length - 1].text)) {
        out[out.length - 1].text = `${out[out.length - 1].text.trimEnd()} ${trimmed}`
        continue
      }
      out.push({ kind: 'unicodeBullet', text: trimmed })
      prevKind = 'unicodeBullet'
      continue
    }

    // Continuation of an active bullet or footnote (no intervening blank line)
    if (out.length > 0) {
      const prev = out[out.length - 1]

      if (prevKind === 'l1' || prevKind === 'footnote' || prevKind === 'unicodeBullet') {
        prev.text = `${prev.text} ${trimmed}`
        continue
      }

      if (prevKind === 'l2') {
        const shouldJoinUnindented =
          hasUnclosedParens(prev.text) ||
          HANGING_LINE_END_RE.test(prev.text) ||
          /^[a-z(]/.test(trimmed) ||
          /^[^A-Z\s]/.test(trimmed)
        if (isIndented || shouldJoinUnindented) {
          prev.text = `${prev.text} ${trimmed}`
          continue
        }
      }

      if (prevKind === 'plain' && hasUnclosedParens(prev.text)) {
        prev.text = `${prev.text} ${trimmed}`
        continue
      }
    }

    out.push({ kind: 'plain', text: trimmed })
    prevKind = 'plain'
  }

  return out
}

// ── Saint line parser ─────────────────────────────────────────────────────────

function parseSaintLine(text: string): SaintEntry {
  const base = newSaint()

  // 1. Detect title prefix first; if none matches at the start, keep verbatim as rawLine
  let matchedTitle: SaintTitle | null = null
  for (const { re, title } of TITLE_PATTERNS) {
    if (re.test(text)) {
      matchedTitle = title
      break
    }
  }
  if (!matchedTitle) {
    return rawSaint(text)
  }

  // 2. Strip trailing parenthetical note: e.g. "(relics only)"
  let notes = ''
  const notesMatch = text.match(/\s*\(([^)]*)\)\s*$/)
  if (notesMatch) {
    notes = notesMatch[1].trim()
    text = text.slice(0, text.length - notesMatch[0].length).trimEnd()
  }

  // 3. Remove title prefix
  let title: SaintTitle = matchedTitle
  let rest = text
  for (const { re, title: t } of TITLE_PATTERNS) {
    const m = text.match(re)
    if (m) {
      title = t
      rest = text.slice(m[0].length)
      break
    }
  }

  // 4. Split on first top-level comma → name / (role + feastDay)
  const commaIdx = findTopLevelComma(rest)
  if (commaIdx === -1) {
    return { ...base, title, name: rest.trim(), notes }
  }

  const name = rest.slice(0, commaIdx).trim()
  const afterName = rest.slice(commaIdx + 1).trim()

  // 5. Find first feast or death date pattern (M/D or d. M/D/YYYY) → role ends just before it
  const feastMatch = afterName.match(/(?:\bd\.\s*)?\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/i)
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
  const logicalLines = unwrapMarkdownLines(markdown)

  let hasExplicitCountryHeadings = false
  const countries: CountrySection[] = []

  let currentCountry: CountrySection = { id: uid(), name: '', locations: [] }
  let currentLocation: Location | null = null
  let currentBuilding: Building | null = null
  let buildingFromBold = false

  function flushBuilding() {
    if (currentBuilding && currentLocation) {
      currentLocation.buildings.push(currentBuilding)
      currentBuilding = null
      buildingFromBold = false
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

  function ensureLocation() {
    if (!currentLocation) {
      currentLocation = { id: uid(), name: 'Unknown', buildings: [] }
    }
  }

  for (let i = 0; i < logicalLines.length; i++) {
    const { kind, text: line } = logicalLines[i]

    // ── H1 heading → new country ──────────────────────────
    if (kind === 'h1') {
      const h1Match = line.match(/^#\s+(.+)/)
      if (h1Match) {
        flushCountry()
        hasExplicitCountryHeadings = true
        currentCountry = { id: uid(), name: h1Match[1].trim(), locations: [] }
      }
      continue
    }

    // ── Footnote definitions → ignore for location/saint structure ──
    if (kind === 'footnote') {
      continue
    }

    // ── Bold-only line (e.g. italy-middle-formatted.md) → building ──
    if (kind === 'bold') {
      ensureLocation()
      flushBuilding()
      const buildingName = line.replace(/^\*\*|\*\*$/g, '').trim()
      currentBuilding = { id: uid(), name: buildingName, saints: [] }
      buildingFromBold = true
      continue
    }

    // ── Level-2+ indented bullet (saint entry) ────────────
    if (kind === 'l2') {
      const level2Match = line.match(/^(\s{2,}|\t)-\s*(.+)/)
      if (level2Match) {
        const content = level2Match[2].trim()
        ensureLocation()
        if (!currentBuilding) {
          currentBuilding = { id: uid(), name: '???', saints: [] }
        }
        if (SAINT_REGEX.test(content)) {
          currentBuilding.saints.push(parseSaintLine(content))
        } else {
          currentBuilding.saints.push(rawSaint(content))
        }
      }
      continue
    }

    // ── Unicode bullet (• Name) → saint entry ─────────────
    if (kind === 'unicodeBullet') {
      const content = line.replace(/^•\s*/, '').trim()
      ensureLocation()
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
    if (kind === 'l1') {
      const content = line.replace(/^-\s*/, '').trim()
      if (!content) continue
      ensureLocation()

      const nextIsLevel2 = i + 1 < logicalLines.length && logicalLines[i + 1].kind === 'l2'

      if (buildingFromBold) {
        if (!currentBuilding) {
          currentBuilding = { id: uid(), name: '???', saints: [] }
        }
        if (SAINT_REGEX.test(content)) {
          currentBuilding.saints.push(parseSaintLine(content))
        } else {
          currentBuilding.saints.push(rawSaint(content))
        }
      } else if (isInlineLevel1Saint(content, nextIsLevel2)) {
        if (!currentBuilding) {
          currentBuilding = { id: uid(), name: '???', saints: [] }
        }
        const saintText = content.replace(/^\?\?\?\s*/, '').trim()
        currentBuilding.saints.push(parseSaintLine(saintText || content))
      } else {
        flushBuilding()
        currentBuilding = { id: uid(), name: content, saints: [] }
      }
      continue
    }

    // ── Higher headings (##–######) → location ────────────
    if (kind === 'heading') {
      const higherHeading = line.match(/^#{2,6}\s+(.+)/)
      if (higherHeading) {
        flushLocation()
        currentLocation = { id: uid(), name: higherHeading[1].trim(), buildings: [] }
      }
      continue
    }

    // ── Plain text line → location name ───────────────────
    if (line.length > 0 && line.length < 240) {
      flushLocation()
      currentLocation = { id: uid(), name: line.trim(), buildings: [] }
      continue
    }

    // ── Fallback → store as raw saint entry ───────────────
    if (currentBuilding) {
      const last = currentBuilding.saints[currentBuilding.saints.length - 1]
      if (last && last.rawLine) {
        last.rawLine += '\n' + line
      } else {
        currentBuilding.saints.push(rawSaint(line))
      }
    } else if (currentLocation) {
      currentBuilding = { id: uid(), name: '???', saints: [] }
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
