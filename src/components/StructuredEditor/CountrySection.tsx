import { useState } from 'react'
import { type CountrySection, type Location, newLocation } from '../../utils/regionsModel'
import { LocationBlock } from './LocationBlock'

interface Props {
  country: CountrySection
  showHeading: boolean  // false for implicit-from-filename files
  filename: string
  onChange: (c: CountrySection) => void
  onDelete: () => void
  canDelete: boolean
}

export function CountrySectionBlock({ country, showHeading, filename, onChange, onDelete, canDelete }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const set = <K extends keyof CountrySection>(key: K, value: CountrySection[K]) =>
    onChange({ ...country, [key]: value })

  const updateLocation = (idx: number, location: Location) =>
    set('locations', country.locations.map((l, i) => i === idx ? location : l))

  const deleteLocation = (idx: number) =>
    set('locations', country.locations.filter((_, i) => i !== idx))

  const addLocation = () =>
    set('locations', [...country.locations, newLocation()])

  const displayName = showHeading
    ? (country.name || 'Unnamed Country')
    : filename.replace('.md', '').replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

  return (
    <div className="se-country">
      {showHeading ? (
        <div className="se-country-header">
          <button
            type="button"
            className="se-collapse-btn"
            onClick={() => setCollapsed((v) => !v)}
            aria-expanded={!collapsed}
          >
            {collapsed ? '▶' : '▼'}
          </button>
          <input
            className="se-input se-country-name"
            type="text"
            value={country.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Country name"
            aria-label="Country name"
          />
          {canDelete && (
            <button
              type="button"
              className="se-delete-btn se-delete-btn--sm"
              onClick={onDelete}
              title="Delete country section"
            >
              ×
            </button>
          )}
        </div>
      ) : (
        <div className="se-country-implicit-label">
          <span>📂 {displayName}</span>
          <span className="se-country-implicit-hint">(country from filename)</span>
        </div>
      )}

      {!collapsed && (
        <div className="se-locations-list">
          {country.locations.map((location, idx) => (
            <LocationBlock
              key={location.id}
              location={location}
              onChange={(l) => updateLocation(idx, l)}
              onDelete={() => deleteLocation(idx)}
            />
          ))}
          <button type="button" className="se-add-btn se-add-location" onClick={addLocation}>
            + Add Location
          </button>
        </div>
      )}
    </div>
  )
}
