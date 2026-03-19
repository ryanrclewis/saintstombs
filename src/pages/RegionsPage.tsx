import { useMemo, useState } from 'react'
import { marked } from 'marked'

const REGION_IMPORTS: Record<string, () => Promise<{ default: string }>> = {
  Africa: () => import('../../content/saints/regions/africa.md?raw'),
  Asia: () => import('../../content/saints/regions/asia.md?raw'),
  Austria: () => import('../../content/saints/regions/austria.md?raw'),
  Belgium: () => import('../../content/saints/regions/belgium.md?raw'),
  Britain: () => import('../../content/saints/regions/britain.md?raw'),
  'Eastern Europe': () => import('../../content/saints/regions/eastern-europe.md?raw'),
  France: () => import('../../content/saints/regions/france.md?raw'),
  Germany: () => import('../../content/saints/regions/germany.md?raw'),
  Ireland: () => import('../../content/saints/regions/ireland.md?raw'),
  Italy: () => import('../../content/saints/regions/italy.md?raw'),
  'Latin America': () => import('../../content/saints/regions/latin-america.md?raw'),
  Netherlands: () => import('../../content/saints/regions/netherlands.md?raw'),
  'North America': () => import('../../content/saints/regions/north-america.md?raw'),
  Oceania: () => import('../../content/saints/regions/oceania.md?raw'),
  Portugal: () => import('../../content/saints/regions/portugal.md?raw'),
  Scandinavia: () => import('../../content/saints/regions/scandinavia.md?raw'),
  Spain: () => import('../../content/saints/regions/spain.md?raw'),
  Switzerland: () => import('../../content/saints/regions/switzerland.md?raw'),
}

const REGION_NAMES = Object.keys(REGION_IMPORTS)

const configureMarked = () => {
  const renderer = new marked.Renderer()
  renderer.heading = ({ text, depth, raw }: { text: string; depth: number; raw: string }) => {
    const id = raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .replace(/[^\w]+/g, '-')
      .replace(/^-+|-+$/g, '')
    return `<h${depth} id="${id}">${text}</h${depth}>`
  }
  return renderer
}

const renderer = configureMarked()

export function RegionsPage() {
  const [selectedRegion, setSelectedRegion] = useState('')
  const [markdownText, setMarkdownText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRegionChange = async (region: string) => {
    setSelectedRegion(region)
    if (!region) {
      setMarkdownText(null)
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    setMarkdownText(null)
    try {
      const mod = await REGION_IMPORTS[region]()
      setMarkdownText(mod.default)
    } catch {
      setError('Failed to load region content.')
    } finally {
      setLoading(false)
    }
  }

  const html = useMemo(() => {
    if (!markdownText) return ''
    return marked.parse(markdownText, { renderer }) as string
  }, [markdownText])

  const tocItems = useMemo(() => {
    if (!html) return []
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = html
    return Array.from(tempDiv.querySelectorAll('h1')).map((h1) => ({
      id: h1.id,
      text: h1.textContent ?? '',
    }))
  }, [html])

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
            onChange={(event) => void handleRegionChange(event.target.value)}
          >
            <option value="">Select a region…</option>
            {REGION_NAMES.map((region) => (
              <option key={region} value={region}>
                {region}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="result-meta" role="status" aria-live="polite" aria-atomic="true">
        {loading ? (
          <p className="loading-status">
            <span className="loading-dot" aria-hidden="true" />
            Loading {selectedRegion}…
          </p>
        ) : !selectedRegion ? (
          <p>Choose a region above to view its saints.</p>
        ) : null}
        {error ? <p className="error">{error}</p> : null}
      </section>

      {!loading && html ? (
        <div className="region-content-wrap">
          {tocItems.length > 1 ? (
            <nav className="region-toc" aria-label="Jump to country">
              <p className="region-toc-label">Jump to:</p>
              <div className="region-toc-links">
                {tocItems.map((item) => (
                  <a key={item.id} href={`#${item.id}`} className="region-toc-pill">
                    {item.text}
                  </a>
                ))}
              </div>
            </nav>
          ) : null}
          <article
            className="region-markdown content-page"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      ) : null}

      {!loading && !html && !error && !selectedRegion ? null : null}
    </>
  )
}

