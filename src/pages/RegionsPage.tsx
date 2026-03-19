import { useDeferredValue, useMemo, useState } from 'react'
import { useSaintSearch } from '../hooks/useSaintSearch'

const INITIAL_VISIBLE_RESULTS = 24
const LOAD_MORE_STEP = 24

export function RegionsPage() {
  const { error, filters, loading, results: allSaints } = useSaintSearch()
  const [selectedRegion, setSelectedRegion] = useState('')
  const [query, setQuery] = useState('')
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_RESULTS)
  const deferredQuery = useDeferredValue(query)

  const handleRegionChange = (value: string) => {
    setSelectedRegion(value)
    setVisibleCount(INITIAL_VISIBLE_RESULTS)
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    setVisibleCount(INITIAL_VISIBLE_RESULTS)
  }

  const regionSaints = useMemo(() => {
    if (!selectedRegion) return []
    const normalizedQuery = deferredQuery.trim().toLowerCase()
    return allSaints.filter((saint) => {
      const regionMatch = saint.region === selectedRegion
      const queryMatch =
        normalizedQuery.length === 0 || saint.normalizedSearchText.includes(normalizedQuery)
      return regionMatch && queryMatch
    })
  }, [selectedRegion, deferredQuery, allSaints])

  const locationGroups = useMemo(() => {
    const groups = new Map<string, typeof regionSaints>()
    for (const saint of regionSaints) {
      const loc = saint.city_or_region || 'Unknown Location'
      if (!groups.has(loc)) groups.set(loc, [])
      groups.get(loc)!.push(saint)
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [regionSaints])

  const visibleGroups = useMemo(() => {
    let count = 0
    const visible: Array<[string, typeof regionSaints]> = []
    for (const [loc, saints] of locationGroups) {
      if (count >= visibleCount) break
      visible.push([loc, saints])
      count += saints.length
    }
    return visible
  }, [locationGroups, visibleCount])

  const totalVisible = visibleGroups.reduce((sum, [, s]) => sum + s.length, 0)
  const hasMoreResults = totalVisible < regionSaints.length

  return (
    <>
      <header className="hero">
        <p className="eyebrow">Browse by Region</p>
        <h1>Regions</h1>
        <p className="subhead">
          Select a geographic region to explore all saints and their locations within it.
        </p>
      </header>

      <section className="control-panel" aria-label="Filter by region">
        <div className="field">
          <label htmlFor="region-select">Region</label>
          <select
            id="region-select"
            value={selectedRegion}
            onChange={(event) => handleRegionChange(event.target.value)}
          >
            <option value="">Select a region…</option>
            {filters.regions.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>
        {selectedRegion ? (
          <div className="field">
            <label htmlFor="region-query">Search within region</label>
            <input
              id="region-query"
              type="search"
              value={query}
              placeholder="Name, location, feast day…"
              onChange={(event) => handleQueryChange(event.target.value)}
            />
          </div>
        ) : null}
      </section>

      <section className="result-meta" role="status" aria-live="polite" aria-atomic="true">
        {loading ? (
          <p className="loading-status">
            <span className="loading-dot" aria-hidden="true" />
            Loading saints index…
          </p>
        ) : selectedRegion ? (
          <p>
            Showing {totalVisible} of {regionSaints.length} saints in {selectedRegion}
          </p>
        ) : (
          <p>Choose a region above to view its saints.</p>
        )}
        {error ? <p className="error">{error}</p> : null}
      </section>

      {!loading && selectedRegion && regionSaints.length === 0 ? (
        <section className="result-grid">
          <article className="empty-state">No saints found for this region.</article>
        </section>
      ) : null}

      {!loading && selectedRegion && visibleGroups.length > 0 ? (
        <section className="regions-location-list" aria-label="Saints by location">
          {visibleGroups.map(([location, saints]) => (
            <div key={location} className="location-group">
              <h2 className="location-heading">{location}</h2>
              <div className="result-grid">
                {saints.map((saint) => (
                  <article key={saint.id} className="saint-card">
                    <h3>{saint.name}</h3>
                    <p className="summary">{saint.summary}</p>
                    <ul className="meta">
                      <li>
                        <strong>Country:</strong> {saint.country}
                      </li>
                      <li>
                        <strong>Location:</strong> {saint.city_or_region}
                      </li>
                    </ul>
                    {saint.tags?.length ? (
                      <div className="tags">
                        {saint.tags.map((tag) => (
                          <span key={`${saint.id}-${tag}`}>{tag}</span>
                        ))}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : null}

      {!loading && hasMoreResults ? (
        <div className="result-actions">
          <button
            type="button"
            className="load-more-button"
            onClick={() => setVisibleCount((count) => count + LOAD_MORE_STEP)}
          >
            Show more saints
          </button>
        </div>
      ) : null}
    </>
  )
}
