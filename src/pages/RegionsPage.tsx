import { useEffect, useMemo, useState } from 'react'
import { marked } from 'marked'

type RegionEntry = { file: string; title: string }

export default function RegionsPage() {
  const [entries, setEntries] = useState<RegionEntry[]>([])
  const [selectedFile, setSelectedFile] = useState<string>('')
  const [content, setContent] = useState<string>('')

  useEffect(() => {
    let cancelled = false
    fetch('/data/regions.json')
      .then((r) => r.json())
      .then((data: RegionEntry[]) => {
        if (cancelled) return
        setEntries(data)
        setSelectedFile(data[0]?.file ?? '')
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedFile) {
      setContent('')
      return
    }

    let cancelled = false
    fetch(`/data/regions/${selectedFile}`)
      .then((r) => r.text())
      .then((text) => {
        if (cancelled) return
        setContent(text)
      })

    return () => {
      cancelled = true
    }
  }, [selectedFile])

  const rendered = useMemo(() => {
    try {
      return marked.parse(content || '')
    } catch {
      return ''
    }
  }, [content])

  return (
    <div>
      <header className="hero">
        <p className="eyebrow">Explore by Region</p>
        <h1>Explore Holy Graves</h1>
        <p className="subhead">Select a region to read about the saints buried there.</p>
      </header>

      <section className="control-panel" aria-label="Region selector">
        <div className="field">
          <label htmlFor="region-select">Region / Continent</label>
          <select
            id="region-select"
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
          >
            <option value="">(choose a region)</option>
            {entries.map((entry) => (
              <option key={entry.file} value={entry.file}>
                {entry.title}
              </option>
            ))}
          </select>
        </div>
      </section>

      <main className="markdown-content" id="results-container">
        {!content ? (
          <div className="empty-state">
            <p>Select a region above to read about the saints.</p>
          </div>
        ) : (
          <article dangerouslySetInnerHTML={{ __html: rendered }} />
        )}
      </main>
    </div>
  )
}
