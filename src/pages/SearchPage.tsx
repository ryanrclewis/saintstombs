import { useEffect, useState } from 'react'
import { useSaintSearch } from '../hooks/useSaintSearch'

const SKELETON_COUNT = 6
const INITIAL_VISIBLE_RESULTS = 24
const LOAD_MORE_STEP = 24

export function SearchPage() {
  const {
    countries,
    continent,
    country,
    error,
    filters,
    handleContinentChange,
    loading,
    query,
    results,
    setCountry,
    setQuery,
  } = useSaintSearch()
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_RESULTS)

  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_RESULTS)
  }, [continent, country, query])

  const visibleResults = results.slice(0, visibleCount)
  const hasMoreResults = visibleResults.length < results.length

  return (
    <>
      <header className="hero">
        <p className="eyebrow">Search Saints</p>
        <h1>Search</h1>
        <p className="subhead">
         Search and filter saints by name, location, and more.
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

      <section className="result-meta" role="status" aria-live="polite" aria-atomic="true">
        {loading ? (
          <p className="loading-status">
            <span className="loading-dot" aria-hidden="true" />
            Loading saints index...
          </p>
        ) : (
          <p>
            Showing {visibleResults.length} of {results.length} saints
          </p>
        )}
        {error ? <p className="error">{error}</p> : null}
      </section>

      <section className="result-grid" aria-busy={loading}>
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
          ? visibleResults.map((saint) => (
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
                {saint.tags?.length ? (
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
