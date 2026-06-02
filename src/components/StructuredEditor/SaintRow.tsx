import { useState } from 'react'
import { SAINT_TITLES, type SaintEntry, type SaintTitle } from '../../utils/regionsModel'

interface Props {
  saint: SaintEntry
  onChange: (s: SaintEntry) => void
  onDelete: () => void
}

export function SaintRow({ saint, onChange, onDelete }: Props) {
  const [showRaw, setShowRaw] = useState(false)

  const set = <K extends keyof SaintEntry>(key: K, value: SaintEntry[K]) =>
    onChange({ ...saint, [key]: value })

  if (saint.rawLine) {
    return (
      <div className="se-saint-row se-saint-row--raw">
        <span className="se-raw-badge" title="This entry uses non-standard formatting">RAW</span>
        <button
          type="button"
          className="se-raw-toggle"
          onClick={() => setShowRaw((v) => !v)}
        >
          {showRaw ? 'Hide' : 'Show'} content
        </button>
        {showRaw && (
          <textarea
            className="se-raw-textarea"
            value={saint.rawLine}
            onChange={(e) => set('rawLine', e.target.value)}
            rows={3}
          />
        )}
        <button type="button" className="se-delete-btn" onClick={onDelete} title="Delete entry">×</button>
      </div>
    )
  }

  return (
    <div className="se-saint-row">
      <select
        className="se-input se-title-select"
        value={saint.title}
        onChange={(e) => set('title', e.target.value as SaintTitle)}
        aria-label="Title"
      >
        {SAINT_TITLES.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>

      <input
        className="se-input se-name-input"
        type="text"
        value={saint.name}
        onChange={(e) => set('name', e.target.value)}
        placeholder="Name"
        aria-label="Saint name"
      />

      <input
        className="se-input se-role-input"
        type="text"
        value={saint.role}
        onChange={(e) => set('role', e.target.value)}
        placeholder="Role (bishop, martyr…)"
        aria-label="Role"
      />

      <input
        className="se-input se-feast-input"
        type="text"
        value={saint.feastDay}
        onChange={(e) => set('feastDay', e.target.value)}
        placeholder="Feast (7/24)"
        aria-label="Feast day"
      />

      <input
        className="se-input se-notes-input"
        type="text"
        value={saint.notes}
        onChange={(e) => set('notes', e.target.value)}
        placeholder="Notes (relics only…)"
        aria-label="Notes"
      />

      <button type="button" className="se-delete-btn" onClick={onDelete} title="Delete saint">×</button>
    </div>
  )
}
