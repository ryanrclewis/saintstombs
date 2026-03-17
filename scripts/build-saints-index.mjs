import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import matter from 'gray-matter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')
const contentDir = path.join(projectRoot, 'content', 'saints')
const outputDir = path.join(projectRoot, 'public', 'data')
const SUMMARY_MAX_LENGTH = 200

const CONTINENT_BY_FILENAME = {
  'africa.md': 'Africa',
  'asia.md': 'Asia',
  'oceania.md': 'Oceania',
  'north-america.md': 'North America',
  'latin-america.md': 'South America',
  'austria.md': 'Europe',
  'belgium.md': 'Europe',
  'britain.md': 'Europe',
  'eastern-europe.md': 'Europe',
  'france.md': 'Europe',
  'germany.md': 'Europe',
  'ireland.md': 'Europe',
  'italy-middle-formatted.md': 'Europe',
  'italy.md': 'Europe',
  'netherlands.md': 'Europe',
  'portugal.md': 'Europe',
  'scandinavia.md': 'Europe',
  'spain.md': 'Europe',
  'switzerland.md': 'Europe',
}

const toArray = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value.map((entry) => String(entry).trim()).filter(Boolean)
  return [String(value).trim()].filter(Boolean)
}

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const compactSpaces = (value) => String(value).replace(/\s+/g, ' ').trim()

const truncateText = (value, maxLength) => {
  const text = compactSpaces(value)
  if (text.length <= maxLength) {
    return text
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}…`
}

const markdownToText = (markdown) =>
  compactSpaces(
    markdown
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]*`/g, ' ')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/[>#*_~-]/g, ' '),
  )

const ensureString = (value, fallback = 'Unknown') => {
  const text = compactSpaces(value ?? '')
  return text.length > 0 ? text : fallback
}

const titleFromFilename = (filePath) => {
  const stem = path.basename(filePath, '.md')
  return stem
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const inferContinent = (filePath, explicitValue) => {
  const explicit = compactSpaces(explicitValue ?? '')
  if (explicit) return explicit
  return CONTINENT_BY_FILENAME[path.basename(filePath).toLowerCase()] || 'Unknown'
}

const parseLegacyRegionsMarkdown = (fileText, filePath, relativeSource) => {
  const fileName = path.basename(filePath)
  if (/^(readme|about)\.md$/i.test(fileName)) {
    return []
  }

  const lines = fileText.split(/\r?\n/)
  const firstHeading = lines.find((line) => /^#\s+/.test(line.trim()))
  let currentCountry = firstHeading ? compactSpaces(firstHeading.replace(/^#\s+/, '')) : titleFromFilename(filePath)
  let currentLocation = 'Unknown'
  const continent = inferContinent(filePath)
  const saints = []

  for (const rawLine of lines) {
    const line = compactSpaces(rawLine)
    if (!line) continue

    if (/^#\s+/.test(line)) {
      currentCountry = compactSpaces(line.replace(/^#\s+/, '')) || currentCountry
      continue
    }

    if (!line.startsWith('-') && !/^#{2,6}\s+/.test(line) && line.length < 140) {
      currentLocation = line
      continue
    }

    if (!line.startsWith('-')) {
      continue
    }

    const entry = compactSpaces(line.replace(/^-+\s*/, ''))
    if (!/(st\.|saint|bl\.|blessed|venerable|servant of god)/i.test(entry)) {
      continue
    }

    const nameMatch = entry.match(/((?:St\.|Saint|Bl\.|Blessed|Venerable|Servant of God)\s+[^,;(]+)/i)
    const feastMatch = entry.match(/\b(\d{1,2}\/\d{1,2})\b/)
    const saintName = nameMatch ? compactSpaces(nameMatch[1]) : entry.slice(0, 80)

    saints.push(
      normalizeSaint(
        {
          name: saintName,
          feast_day: feastMatch ? feastMatch[1] : 'Unknown',
          continent,
          country: currentCountry,
          city_or_region: currentLocation,
          summary: entry,
          tags: [],
          aliases: [],
        },
        relativeSource,
        saints.length,
      ),
    )
  }

  return saints
}

const normalizeSaint = (input, sourcePath, indexInFile = 0) => {
  const name = ensureString(input.name, '')
  if (!name) {
    throw new Error(`Missing saint name in ${sourcePath}`)
  }

  const continent = ensureString(input.continent)
  const country = ensureString(input.country)
  const cityOrRegion = ensureString(input.city_or_region)
  const feastDay = ensureString(input.feast_day, 'Unknown')
  const summary = truncateText(
    ensureString(input.summary, 'No summary available.'),
    SUMMARY_MAX_LENGTH,
  )
  const aliases = toArray(input.aliases)
  const tags = toArray(input.tags)
  const idBase = [name, country, continent].map(slugify).filter(Boolean).join('-')

  const saint = {
    id: input.id ? String(input.id) : `${idBase || slugify(name)}-${indexInFile + 1}`,
    name,
    country,
    continent,
    city_or_region: cityOrRegion,
    summary,
    search_text: [
      name,
      feastDay,
      country,
      continent,
      cityOrRegion,
      ...tags,
      ...aliases,
    ]
      .join(' ')
      .toLowerCase(),
  }

  if (tags.length > 0) {
    saint.tags = tags
  }

  return saint
}

const walkMarkdownFiles = async (rootDir) => {
  const entries = await fs.readdir(rootDir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(rootDir, entry.name)
      if (entry.isDirectory()) return walkMarkdownFiles(fullPath)
      if (entry.isFile() && entry.name.endsWith('.md')) return [fullPath]
      return []
    }),
  )
  return files.flat()
}

const parseSaintsFile = async (filePath) => {
  const relativeSource = path.relative(projectRoot, filePath).replace(/\\/g, '/')
  const fileText = await fs.readFile(filePath, 'utf8')
  const { data, content } = matter(fileText)

  if (Array.isArray(data.saints)) {
    return data.saints.map((saint, index) =>
      normalizeSaint(
        {
          continent: data.continent,
          country: data.country,
          city_or_region: data.city_or_region,
          tags: data.tags,
          ...saint,
        },
        relativeSource,
        index,
      ),
    )
  }

  if (data.name) {
    return [
      normalizeSaint(
        {
          ...data,
          continent: inferContinent(filePath, data.continent),
          summary: data.summary || markdownToText(content).slice(0, 260),
        },
        relativeSource,
      ),
    ]
  }

  return parseLegacyRegionsMarkdown(fileText, filePath, relativeSource)
}

const generate = async () => {
  await fs.mkdir(outputDir, { recursive: true })

  let files = []
  try {
    files = await walkMarkdownFiles(contentDir)
  } catch {
    files = []
  }

  if (files.length === 0) {
    await fs.writeFile(path.join(outputDir, 'saints.json'), '[]\n')
    await fs.writeFile(
      path.join(outputDir, 'filters.json'),
      JSON.stringify({ continents: [], countriesByContinent: {} }, null, 2) + '\n',
    )
    return
  }

  const saintsNested = await Promise.all(files.map((file) => parseSaintsFile(file)))
  const saints = saintsNested.flat().sort((a, b) => a.name.localeCompare(b.name))

  const countriesByContinent = {}
  for (const saint of saints) {
    if (!countriesByContinent[saint.continent]) {
      countriesByContinent[saint.continent] = new Set()
    }
    countriesByContinent[saint.continent].add(saint.country)
  }

  const filters = {
    continents: Object.keys(countriesByContinent).sort((a, b) => a.localeCompare(b)),
    countriesByContinent: Object.fromEntries(
      Object.entries(countriesByContinent)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => [
          key,
          Array.from(value).sort((a, b) => a.localeCompare(b)),
        ]),
    ),
  }

  await fs.writeFile(path.join(outputDir, 'saints.json'), JSON.stringify(saints) + '\n')
  await fs.writeFile(path.join(outputDir, 'filters.json'), JSON.stringify(filters) + '\n')
}

generate().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
