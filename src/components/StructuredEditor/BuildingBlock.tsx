import { type Building, type SaintEntry, newSaint } from '../../utils/regionsModel'
import { SaintRow } from './SaintRow'

interface Props {
  building: Building
  onChange: (b: Building) => void
  onDelete: () => void
}

export function BuildingBlock({ building, onChange, onDelete }: Props) {
  const set = <K extends keyof Building>(key: K, value: Building[K]) =>
    onChange({ ...building, [key]: value })

  const updateSaint = (idx: number, saint: SaintEntry) =>
    set('saints', building.saints.map((s, i) => i === idx ? saint : s))

  const deleteSaint = (idx: number) =>
    set('saints', building.saints.filter((_, i) => i !== idx))

  const addSaint = () =>
    set('saints', [...building.saints, newSaint()])

  const isUnknown = building.name === '???'

  return (
    <div className="se-building">
      <div className="se-building-header">
        <span className="se-building-icon">🏛</span>
        <input
          className="se-input se-building-name"
          type="text"
          value={isUnknown ? '' : building.name}
          onChange={(e) => set('name', e.target.value || '???')}
          placeholder="Building or site name (e.g. Cathedral)"
          aria-label="Building name"
        />
        <button
          type="button"
          className="se-delete-btn se-delete-btn--sm"
          onClick={onDelete}
          title="Delete building and all its saints"
        >
          ×
        </button>
      </div>

      <div className="se-saints-list">
        {building.saints.map((saint, idx) => (
          <SaintRow
            key={saint.id}
            saint={saint}
            onChange={(s) => updateSaint(idx, s)}
            onDelete={() => deleteSaint(idx)}
          />
        ))}
      </div>

      <button type="button" className="se-add-btn se-add-saint" onClick={addSaint}>
        + Add Saint
      </button>
    </div>
  )
}
