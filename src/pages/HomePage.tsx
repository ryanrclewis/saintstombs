import { useSaintSearch } from '../hooks/useSaintSearch'

const SKELETON_COUNT = 6

export function HomePage() {
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
