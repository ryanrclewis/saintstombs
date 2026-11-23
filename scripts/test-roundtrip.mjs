/**
 * Smoke test: parse then serialize each region file using the shared AST parser
 * and report round-trip quality and saint counts.
 * Run: node scripts/test-roundtrip.mjs
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseRegionsMarkdown } from '../src/utils/regionsParser.ts'
import { serializeRegionsDocument } from '../src/utils/regionsSerializer.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const regionsDir = path.resolve(__dirname, '../content/saints/regions')

// ── Run tests ─────────────────────────────────────────────────────────────────

const files = (await fs.readdir(regionsDir))
  .filter((f) => f.endsWith('.md') && !['README.md', 'about.md', 'donate.md'].includes(f))
  .sort()

let totalSaints = 0
let rawLines = 0
let venCount = 0

for (const file of files) {
  const original = await fs.readFile(path.join(regionsDir, file), 'utf8')
  const doc = parseRegionsMarkdown(original)
  const serialized = serializeRegionsDocument(doc)

  // Verify idempotency: serializing then re-parsing produces identical canonical output
  const reparsed = parseRegionsMarkdown(serialized)
  const reserialized = serializeRegionsDocument(reparsed)
  const idempotent = serialized === reserialized

  // Count saints and raw lines
  const allSaints = doc.countries.flatMap((c) => c.locations.flatMap((l) => l.buildings.flatMap((b) => b.saints)))
  totalSaints += allSaints.length
  const raw = allSaints.filter((s) => s.rawLine).length
  rawLines += raw
  venCount += allSaints.filter((s) => s.title === 'Ven.' || s.title === 'Venerable').length

  // Compare non-empty line counts as a proxy for round-trip quality
  const origLines = original.split('\n').filter((l) => l.trim()).length
  const serLines = serialized.split('\n').filter((l) => l.trim()).length
  const diff = serLines - origLines
  const status = idempotent ? '✅' : '❌ non-idempotent'

  console.log(
    `${status} ${file.padEnd(30)} orig=${origLines} ser=${serLines} diff=${diff > 0 ? '+' : ''}${diff} saints=${allSaints.length} raw=${raw}`,
  )
}

console.log(`\nTotal saints parsed: ${totalSaints}`)
console.log(`Venerables parsed (Ven./Venerable): ${venCount}`)
console.log(`Raw (unparseable) lines: ${rawLines}`)
