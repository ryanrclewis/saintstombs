import { type Building, type Location, newBuilding } from '../../utils/regionsModel'
import { BuildingBlock } from './BuildingBlock'

interface Props {
  location: Location
  onChange: (l: Location) => void
  onDelete: () => void
}

export function LocationBlock({ location, onChange, onDelete }: Props) {
  const set = <K extends keyof Location>(key: K, value: Location[K]) =>
    onChange({ ...location, [key]: value })

  const updateBuilding = (idx: number, building: Building) =>
    set('buildings', location.buildings.map((b, i) => i === idx ? building : b))

  const deleteBuilding = (idx: number) =>
    set('buildings', location.buildings.filter((_, i) => i !== idx))

  const addBuilding = () =>
    set('buildings', [...location.buildings, newBuilding('???')])

  return (
    <div className="se-location">
      <div className="se-location-header">
        <span className="se-location-icon">📍</span>
        <input
          className="se-input se-location-name"
          type="text"
          value={location.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Location name (e.g. Armagh, County Tyrone)"
          aria-label="Location name"
        />
        <button
          type="button"
          className="se-delete-btn se-delete-btn--sm"
          onClick={onDelete}
          title="Delete location"
        >
          ×
        </button>
      </div>

      <div className="se-buildings-list">
        {location.buildings.map((building, idx) => (
          <BuildingBlock
            key={building.id}
            building={building}
            onChange={(b) => updateBuilding(idx, b)}
            onDelete={() => deleteBuilding(idx)}
          />
        ))}
      </div>

      <button type="button" className="se-add-btn se-add-building" onClick={addBuilding}>
        + Add Building / Site
      </button>
    </div>
  )
}
