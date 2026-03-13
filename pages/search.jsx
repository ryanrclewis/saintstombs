import { useState, useEffect } from 'react';
import Layout from '../components/Layout';

const REGIONS = [
  'africa', 'asia', 'austria', 'belgium', 'britain', 'eastern-europe',
  'france', 'germany', 'ireland', 'italy', 'latin-america', 'netherlands',
  'north-america', 'oceania', 'portugal', 'scandinavia', 'spain', 'switzerland',
];

export default function Search() {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('');
  const [results, setResults] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function doSearch(q, r, p) {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ q, page: String(p) });
      if (r) params.set('region', r);
      const res = await fetch(`/api/search?${params}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResults(data.results);
      setTotal(data.total);
      setPage(p);
    } catch (err) {
      setError(err.message || 'Search failed.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    doSearch(query, region, 1);
  }

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  return (
    <Layout
      title="SaintsTombs - Search"
      description="Search for saints, martyrs, and holy figures by name or location across every region."
      ogUrl="https://saintstombs.com/search"
      activePage="search"
    >
      <div className="background-globes"></div>
      <main className="explorer-container" id="main-content">
        <header className="explorer-header">
          <h1 className="text-gradient">Search Saints</h1>
          <p>Find saints, martyrs, and holy figures by name or location.</p>
        </header>

        <section className="explorer-controls glass" aria-label="Search controls">
          <form id="search-form" role="search" onSubmit={handleSubmit}>
            <div className="search-row">
              <div className="filter-group search-input-group">
                <label htmlFor="search-input">Search</label>
                <input
                  type="search"
                  id="search-input"
                  name="q"
                  placeholder="e.g. Francis, Peter, Rome…"
                  autoComplete="off"
                  aria-label="Search for saints"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="filter-group">
                <label htmlFor="region-filter">Region (optional)</label>
                <select
                  id="region-filter"
                  name="region"
                  aria-label="Filter by region"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                >
                  <option value="">All Regions</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
                  ))}
                </select>
              </div>
              <button type="submit" className="btn-primary search-btn">Search</button>
            </div>
          </form>
        </section>

        <section className="markdown-content glass" aria-live="polite" aria-label="Search results">
          {loading && <div className="empty-state"><p>Searching...</p></div>}
          {error && <div className="empty-state"><p>Error: {error}</p></div>}
          {!loading && results === null && (
            <div className="empty-state"><p>Enter a name or location above to search the database.</p></div>
          )}
          {!loading && results !== null && results.length === 0 && (
            <div className="empty-state"><p>No results found.</p></div>
          )}
          {!loading && results && results.length > 0 && (
            <>
              <p className="search-meta">{total.toLocaleString()} result{total !== 1 ? 's' : ''} found</p>
              <ul className="search-results-list">
                {results.map((r, i) => (
                  <li key={i} className="search-result-item">
                    <strong>{r.entry}</strong>
                    {r.church && <span className="result-church"> — {r.church}</span>}
                    {r.location && <span className="result-location">, {r.location}</span>}
                    {r.region && <span className="result-region"> ({r.region})</span>}
                  </li>
                ))}
              </ul>
              {totalPages > 1 && (
                <div className="pagination">
                  {page > 1 && (
                    <button className="btn-secondary" onClick={() => doSearch(query, region, page - 1)}>
                      ← Previous
                    </button>
                  )}
                  <span>Page {page} of {totalPages}</span>
                  {page < totalPages && (
                    <button className="btn-secondary" onClick={() => doSearch(query, region, page + 1)}>
                      Next →
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <div className="background-overlay"></div>
    </Layout>
  );
}
