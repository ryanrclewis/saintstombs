import { marked } from 'marked'
import { useEffect, useRef, useState } from 'react'
import './RegionsPage.css'

const REGIONS = [
  { label: 'Africa', file: 'africa.md' },
  { label: 'Asia', file: 'asia.md' },
  { label: 'Austria', file: 'austria.md' },
  { label: 'Belgium', file: 'belgium.md' },
  { label: 'Britain', file: 'britain.md' },
  { label: 'Eastern Europe', file: 'eastern-europe.md' },
  { label: 'France', file: 'france.md' },
  { label: 'Germany', file: 'germany.md' },
  { label: 'Ireland', file: 'ireland.md' },
  { label: 'Italy', file: 'italy.md' },
  { label: 'Latin America', file: 'latin-america.md' },
  { label: 'Netherlands', file: 'netherlands.md' },
  { label: 'North America', file: 'north-america.md' },
  { label: 'Oceania', file: 'oceania.md' },
  { label: 'Portugal', file: 'portugal.md' },
  { label: 'Scandinavia', file: 'scandinavia.md' },
  { label: 'Spain', file: 'spain.md' },
  { label: 'Switzerland', file: 'switzerland.md' },
]

// Configure marked to add IDs to headings for TOC anchor links
const renderer = new marked.Renderer()
renderer.heading = ({ text, depth, raw }: { text: string; depth: number; raw: string }) => {
  const id = raw.toLowerCase().replace(/[^\w]+/g, '-').replace(/^-+|-+$/g, '')
  return `<h${depth} id="${id}">${text}</h${depth}>`
}
marked.use({ renderer })

function buildToc(html: string, file: string): string {
  if (file.toLowerCase().includes('italy')) return ''
  const temp = document.createElement('div')
  temp.innerHTML = html
  const h1s = Array.from(temp.querySelectorAll('h1'))
  if (h1s.length === 0) return ''
  const links = h1s.map((h) => `<a href="#${h.id}">${h.textContent}</a>`).join('')
  return `<div class="regions-toc"><h3>Jump to Country</h3><div class="regions-toc-links">${links}</div></div>`
}

export function RegionsPage() {
  const [selected, setSelected] = useState('')
  const [html, setHtml] = useState('')
  const [toc, setToc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const resultsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    setError('')
    setHtml('')
    setToc('')

    fetch(`/regions/${selected}`)
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load region file')
        return r.text()
      })
      .then((md) => {
        const parsed = marked.parse(md) as string
        setToc(buildToc(parsed, selected))
        setHtml(parsed)

        // Scroll to results on mobile
        if (window.innerWidth < 768) {
          setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
        }
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false))
  }, [selected])

  return (
    <>
      <header className="hero">
        <p className="eyebrow">Browse by Region</p>
        <h1>Explore Holy Graves</h1>
        <p className="subhead">Select a region to discover the saints buried there.</p>
      </header>

      <section className="control-panel" aria-label="Select a region">
        <div className="field">
          <label htmlFor="region-select">Region / Continent</label>
          <select
            id="region-select"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">— Choose a region —</option>
            {REGIONS.map((r) => (
              <option key={r.file} value={r.file}>{r.label}</option>
            ))}
          </select>
        </div>
      </section>

      <div ref={resultsRef} className="regions-results">
        {!selected && !loading && (
          <div className="empty-state">
            <p>Select a region above to read about the saints.</p>
          </div>
        )}

        {loading && (
          <div className="empty-state">
            <p className="loading-status">
              <span className="loading-dot" aria-hidden="true" />
              Loading…
            </p>
          </div>
        )}

        {error && (
          <div className="empty-state">
            <p className="error">{error}</p>
          </div>
        )}

        {!loading && html && (
          <div className="regions-content fade-in">
            {toc && <div dangerouslySetInnerHTML={{ __html: toc }} />}
            <div dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        )}
      </div>
    </>
  )
}
