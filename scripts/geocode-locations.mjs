/**
 * Geocode unique saint locations using the Nominatim OpenStreetMap API.
 *
 * Usage:
 *   npm run geocode
 *
 * Results are cached in public/data/geo-cache.json. Run this script once locally
 * and commit the cache file. Subsequent runs only geocode new locations.
 *
 * Nominatim ToS requires:
 *   - Max 1 request per second
 *   - A descriptive User-Agent header
 *   - No bulk usage for commercial purposes
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const saintsFile = path.join(projectRoot, 'public', 'data', 'saints.json')
const cacheFile = path.join(projectRoot, 'public', 'data', 'geo-cache.json')

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const RATE_LIMIT_MS = 1100
const USER_AGENT = 'SaintsTombs/1.0 (https://github.com/ryanrclewis/saintstombs)'
const SAVE_INTERVAL = 50

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const isUsableLocation = (cityOrRegion) => {
  if (!cityOrRegion || cityOrRegion.length < 3) return false
  if (cityOrRegion.startsWith('&')) return false
  if (/^[?*>]/.test(cityOrRegion.trimStart())) return false
  return true
}

const geocode = async (cityOrRegion, country) => {
  const queryParts = [cityOrRegion]
  if (country && country !== 'Undetermined' && country !== 'Unknown' && country !== 'Other African Saints') {
    queryParts.push(country)
  }
  const query = queryParts.join(', ')

  const url = new URL(NOMINATIM_URL)
  url.searchParams.set('q', query)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '1')
  url.searchParams.set('addressdetails', '0')

  const response = await fetch(url.toString(), {
    headers: { 'User-Agent': USER_AGENT },
  })

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }

  const results = await response.json()
  if (!Array.isArray(results) || results.length === 0) return null

  return {
    lat: parseFloat(results[0].lat),
    lng: parseFloat(results[0].lon),
  }
}

const run = async () => {
  let saintsData
  try {
    saintsData = JSON.parse(await fs.readFile(saintsFile, 'utf8'))
  } catch {
    console.error(`Could not read ${saintsFile}. Run "npm run generate:data" first.`)
    process.exitCode = 1
    return
  }

  let cache = {}
  try {
    cache = JSON.parse(await fs.readFile(cacheFile, 'utf8'))
    console.log(`Loaded existing cache with ${Object.keys(cache).length} entries.`)
  } catch {
    console.log('No existing cache found, starting fresh.')
  }

  const uniquePairs = new Map()
  for (const saint of saintsData) {
    const key = `${saint.city_or_region}||${saint.country}`
    if (!uniquePairs.has(key)) {
      uniquePairs.set(key, { cityOrRegion: saint.city_or_region, country: saint.country })
    }
  }

  const toGeocode = Array.from(uniquePairs.entries()).filter(
    ([key, { cityOrRegion }]) => !(key in cache) && isUsableLocation(cityOrRegion),
  )

  console.log(`Total unique locations: ${uniquePairs.size}`)
  console.log(`Already cached: ${Object.keys(cache).length}`)
  console.log(`To geocode: ${toGeocode.length}`)

  if (toGeocode.length === 0) {
    console.log('Nothing to geocode.')
    return
  }

  const estimatedMinutes = Math.ceil((toGeocode.length * RATE_LIMIT_MS) / 60000)
  console.log(`Estimated time: ~${estimatedMinutes} minute(s) at 1 req/sec`)
  console.log('Starting geocoding...\n')

  let done = 0
  let found = 0
  let notFound = 0
  let errors = 0

  for (const [key, { cityOrRegion, country }] of toGeocode) {
    try {
      const coords = await geocode(cityOrRegion, country)
      cache[key] = coords
      done++
      if (coords) {
        found++
      } else {
        notFound++
      }

      if (done % SAVE_INTERVAL === 0) {
        await fs.writeFile(cacheFile, JSON.stringify(cache, null, 2) + '\n')
        console.log(`  ${done}/${toGeocode.length} — found: ${found}, not found: ${notFound}, errors: ${errors}`)
      }

      await delay(RATE_LIMIT_MS)
    } catch (err) {
      console.error(`  Error geocoding "${key}": ${err.message}`)
      cache[key] = null
      done++
      errors++
      await delay(RATE_LIMIT_MS)
    }
  }

  await fs.writeFile(cacheFile, JSON.stringify(cache, null, 2) + '\n')

  console.log(`\nDone!`)
  console.log(`  Total geocoded: ${done}`)
  console.log(`  Found coordinates: ${found}`)
  console.log(`  Not found: ${notFound}`)
  console.log(`  Errors: ${errors}`)
  console.log(`\nCache saved to: ${cacheFile}`)
  console.log('Now run "npm run generate:data" to rebuild saints.json with coordinates.')
}

run().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
