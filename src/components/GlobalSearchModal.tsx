import { useEffect, useRef } from 'react'
import { useSaintSearch } from '../hooks/useSaintSearch'

type GlobalSearchModalProps = {
  isOpen: boolean
  onClose: () => void
}

const SKELETON_COUNT = 3

export function GlobalSearchModal({ isOpen, onClose }: GlobalSearchModalProps) {
  const inputRef = useRef<HTMLInputElement>(null)
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

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const timer = window.setTimeout(() => {
      inputRef.current?.focus()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="search-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="global-search-title"
      onClick={onClose}
    >
      <section
        className="search-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="search-modal-header">
          <div>
            <p className="eyebrow">Quick Search</p>
            <h2 id="global-search-title">Find Saints</h2>
          </div>
          <button
            type="button"
            className="search-modal-close"
            onClick={onClose}
            aria-label="Close search"
          >
            Esc
          </button>
        </header>

        <section className="control-panel search-modal-controls" aria-label="Search and filter saints">
          <div className="field">
            <label htmlFor="global-query">Search</label>
            <input
              ref={inputRef}
              id="global-query"
              type="search"
              value={query}
              placeholder="Name, alias, tag, city, feast day..."
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="global-continent">Continent</label>
            <select
              id="global-continent"
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
            <label htmlFor="global-country">Country</label>
            <select
              id="global-country"
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

        <section className="result-meta search-modal-meta">
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

        <section className="result-grid search-modal-results" aria-live="polite">
          {loading
            ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
                <article
                  key={`search-loading-${index}`}
                  className="saint-card skeleton-card"
                  aria-hidden="true"
                >
                  <div className="skeleton-line skeleton-title" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line skeleton-short" />
                </article>
              ))
            : null}
          {!loading && results.length === 0 ? (
            <article className="empty-state">No saints matched your filters.</article>
          ) : null}
          {!loading
            ? results.slice(0, 12).map((saint) => (
                <article key={`global-${saint.id}`} className="saint-card">
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
                  </ul>
                </article>
              ))
            : null}
        </section>
      </section>
    </div>
  )
}
