import type { SaintEntry, RegionDocument } from './regionsModel'

function serializeSaint(saint: SaintEntry): string {
  if (saint.rawLine) {
    return `  - ${saint.rawLine}`
  }
  let line = `  - ${saint.title} ${saint.name}`
  if (saint.role) line += `, ${saint.role}`
  if (saint.feastDay) line += `, ${saint.feastDay}`
  if (saint.notes) line += ` (${saint.notes})`
  return line
}

export function serializeRegionsDocument(doc: RegionDocument): string {
  const parts: string[] = []
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
        for (const saint of building.saints) {
          parts.push(serializeSaint(saint))
        }
      }
    }
  }

  return parts.join('\n') + '\n'
}
