import { useEffect, useMemo, useState } from 'react'

type Saint = {
  id: string
  name: string
  feast_day: string
  country: string
  continent: string
  city_or_region: string
  tags: string[]
  aliases: string[]
  summary: string
  source: string
  search_text: string
}

type FiltersData = {
  continents: string[]
  countriesByContinent: Record<string, string[]>
}

const DEFAULT_FILTERS: FiltersData = {
  continents: [],
  countriesByContinent: {},
}

const SKELETON_COUNT = 6

export function HomePage() {
  const [saints, setSaints] = useState<Saint[]>([])
  const [filters, setFilters] = useState<FiltersData>(DEFAULT_FILTERS)
  const [query, setQuery] = useState('')
  const [continent, setContinent] = useState('All')
  const [country, setCountry] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [saintsResponse, filtersResponse] = await Promise.all([
          fetch('/data/saints.json'),
          fetch('/data/filters.json'),
        ])

        if (!saintsResponse.ok || !filtersResponse.ok) {
          throw new Error('Failed to load saints dataset.')
        }

        const saintsData = (await saintsResponse.json()) as Saint[]
        const filtersData = (await filtersResponse.json()) as FiltersData

        setSaints(saintsData)
        setFilters(filtersData)
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : 'Unknown error occurred.',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  const countries = useMemo(() => {
    if (continent === 'All') {
      const allCountries = new Set<string>()
      Object.values(filters.countriesByContinent).forEach((entries) => {
        entries.forEach((entry) => allCountries.add(entry))
      })
      return Array.from(allCountries).sort((a, b) => a.localeCompare(b))
    }
    return filters.countriesByContinent[continent] ?? []
  }, [continent, filters])

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return saints.filter((saint) => {
      const queryMatch =
        normalizedQuery.length === 0 ||
        saint.search_text.toLowerCase().includes(normalizedQuery)
      const continentMatch = continent === 'All' || saint.continent === continent
      const countryMatch = country === 'All' || saint.country === country

      return queryMatch && continentMatch && countryMatch
    })
  }, [continent, country, query, saints])

  const handleContinentChange = (value: string) => {
    setContinent(value)
    setCountry('All')
  }

  return (
    <>
      <header className="hero">
        <p className="eyebrow">Discover the Sacred</p>
        <h1>SaintsTombs</h1>
        <p className="subhead">
         Journey through history to the final resting places of the world's most revered holy figures.
        </p>
      </header>

      <section className="control-panel" aria-label="Search and filter saints">
        <div className="field">
          <label htmlFor="query">Search</label>
          <input
            id="query"
            type="search"
            value={query}
            placeholder="Name, alias, tag, city, feast day..."
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="continent">Continent</label>
          <select
            id="continent"
            value={continent}
            onChange={(event) => handleContinentChange(event.target.value)}
          >
            <option value="All">All</option>
            {filters.continents.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="country">Country</label>
          <select
            id="country"
            value={country}
            onChange={(event) => setCountry(event.target.value)}
          >
            <option value="All">All</option>
            {countries.map((entry) => (
              <option key={entry} value={entry}>
                {entry}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="result-meta">
        {loading ? (
          <p className="loading-status">
            <span className="loading-dot" aria-hidden="true" />
            Loading saints index...
          </p>
        ) : (
          <p>{results.length} saints found</p>
        )}
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="result-grid" aria-live="polite">
        {loading
          ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <article
                key={`loading-${index}`}
                className="saint-card skeleton-card"
                aria-hidden="true"
              >
                <div className="skeleton-line skeleton-title" />
                <div className="skeleton-line" />
                <div className="skeleton-line skeleton-short" />
                <div className="skeleton-meta">
                  <div className="skeleton-line skeleton-meta-line" />
                  <div className="skeleton-line skeleton-meta-line" />
                  <div className="skeleton-line skeleton-meta-line" />
                </div>
                <div className="skeleton-tags">
                  <span className="skeleton-pill" />
                  <span className="skeleton-pill" />
                </div>
              </article>
            ))
          : null}
        {!loading && results.length === 0 ? (
          <article className="empty-state">No saints matched your filters.</article>
        ) : null}
        {!loading
          ? results.map((saint) => (
              <article key={saint.id} className="saint-card">
                <h2>{saint.name}</h2>
                <p className="summary">{saint.summary}</p>
                <ul className="meta">
                  <li>
                    <strong>Continent:</strong> {saint.continent}
                  </li>
                  <li>
                    <strong>Country:</strong> {saint.country}
                  </li>
                  <li>
                    <strong>Region:</strong> {saint.city_or_region}
                  </li>
                  {/* <li>
                <strong>Feast Day:</strong> {saint.feast_day}
              </li> */}
                </ul>
                {saint.tags.length > 0 ? (
                  <div className="tags">
                    {saint.tags.map((tag) => (
                      <span key={`${saint.id}-${tag}`}>{tag}</span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          : null}
      </section>
    </>
  )
}
