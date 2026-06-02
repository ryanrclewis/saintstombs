import { useCallback, useEffect, useRef, useState } from 'react'
import { type CountrySection, type RegionDocument, newCountry } from '../../utils/regionsModel'
import { parseRegionsMarkdown } from '../../utils/regionsParser'
import { serializeRegionsDocument } from '../../utils/regionsSerializer'
import { CountrySectionBlock } from './CountrySection'
import './StructuredEditor.css'

interface Props {
  markdown: string
  onChange: (md: string) => void
  filename: string
}

type EditorMode = 'structured' | 'raw'

export function StructuredEditor({ markdown, onChange, filename }: Props) {
  const [mode, setMode] = useState<EditorMode>('structured')
  const [doc, setDoc] = useState<RegionDocument>(() => parseRegionsMarkdown(markdown))
  const [rawContent, setRawContent] = useState(markdown)
  const prevFilename = useRef(filename)

  // Reset when a new file is opened
  useEffect(() => {
    if (filename !== prevFilename.current) {
      prevFilename.current = filename
      const parsed = parseRegionsMarkdown(markdown)
      setDoc(parsed)
      setRawContent(markdown)
      setMode('structured')
    }
  }, [filename, markdown])

  const updateDoc = useCallback((newDoc: RegionDocument) => {
    setDoc(newDoc)
    const md = serializeRegionsDocument(newDoc)
    setRawContent(md)
    onChange(md)
  }, [onChange])

  const switchToRaw = () => {
    const md = serializeRegionsDocument(doc)
    setRawContent(md)
    setMode('raw')
  }

  const switchToStructured = () => {
    const parsed = parseRegionsMarkdown(rawContent)
    setDoc(parsed)
    setMode('structured')
  }

  const updateCountry = useCallback((idx: number, country: CountrySection) => {
    updateDoc({ ...doc, countries: doc.countries.map((c, i) => i === idx ? country : c) })
  }, [doc, updateDoc])

  const deleteCountry = useCallback((idx: number) => {
    updateDoc({ ...doc, countries: doc.countries.filter((_, i) => i !== idx) })
  }, [doc, updateDoc])

  const addCountry = useCallback(() => {
    updateDoc({ ...doc, countries: [...doc.countries, newCountry()] })
  }, [doc, updateDoc])

  return (
    <div className="se-root">
      <div className="se-toolbar">
        <span className="se-toolbar-label">
          {mode === 'structured' ? '📝 Structured editor' : '📄 Raw markdown'}
        </span>
        <button
          type="button"
          className={`se-mode-btn${mode === 'structured' ? ' active' : ''}`}
          onClick={switchToStructured}
          disabled={mode === 'structured'}
        >
          Structured
        </button>
        <button
          type="button"
          className={`se-mode-btn${mode === 'raw' ? ' active' : ''}`}
          onClick={switchToRaw}
          disabled={mode === 'raw'}
        >
          Raw Markdown
        </button>
      </div>

      {mode === 'raw' ? (
        <textarea
          className="se-raw-editor"
          value={rawContent}
          onChange={(e) => {
            setRawContent(e.target.value)
            onChange(e.target.value)
          }}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
      ) : (
        <div className="se-structured-content">
          {doc.countries.map((country, idx) => (
            <CountrySectionBlock
              key={country.id}
              country={country}
              showHeading={doc.hasExplicitCountryHeadings}
              filename={filename}
              onChange={(c) => updateCountry(idx, c)}
              onDelete={() => deleteCountry(idx)}
              canDelete={doc.countries.length > 1}
            />
          ))}

          {doc.hasExplicitCountryHeadings && (
            <button type="button" className="se-add-btn se-add-country" onClick={addCountry}>
              + Add Country
            </button>
          )}
        </div>
      )}
    </div>
  )
}
