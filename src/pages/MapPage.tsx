import { useMemo } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useSaintSearch, type Saint } from '../hooks/useSaintSearch'
import '../styles/MapPage.css'

type LocationGroup = {
  lat: number
  lng: number
  label: string
  country: string
  saints: Saint[]
}

const MAX_POPUP_SAINTS = 10

function groupByCoords(saints: Saint[]): LocationGroup[] {
  const map = new Map<string, LocationGroup>()
  for (const saint of saints) {
    if (saint.lat == null || saint.lng == null) continue
    const key = `${saint.lat.toFixed(4)},${saint.lng.toFixed(4)}`
    if (!map.has(key)) {
      map.set(key, {
        lat: saint.lat,
        lng: saint.lng,
        label: saint.city_or_region,
        country: saint.country,
        saints: [],
      })
    }
    map.get(key)!.saints.push(saint)
  }
  return Array.from(map.values())
}

function markerRadius(count: number): number {
  return Math.min(5 + Math.log2(count + 1) * 2.5, 22)
}

export function MapPage() {
  const {
    results,
    filters,
    continent,
    country,
    countries,
    handleContinentChange,
    setCountry,
    loading,
    error,
  } = useSaintSearch()

  const locations = useMemo(() => groupByCoords(results), [results])

  const mappedCount = useMemo(
    () => results.reduce((n, s) => n + (s.lat != null ? 1 : 0), 0),
    [results],
  )

  return (
    <>
      <header className="hero map-hero">
        <p className="eyebrow">Explore the Sacred</p>
        <h1>Map of Saints</h1>
        <p className="subhead">Browse the locations of saints and martyrs across the world.</p>
      </header>

      <section className="control-panel" aria-label="Filter map by region">
        <div className="field">
          <label htmlFor="map-continent">Continent</label>
          <select
            id="map-continent"
            value={continent}
            onChange={(e) => handleContinentChange(e.target.value)}
          >
            <option value="All">All</option>
            {filters.continents.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="map-country">Country</label>
          <select
            id="map-country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            <option value="All">All</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section
        className="result-meta"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {loading ? (
          <p className="loading-status">
            <span className="loading-dot" aria-hidden="true" />
            Loading saints index…
          </p>
        ) : (
          <p>
            Showing {mappedCount.toLocaleString()} of {results.length.toLocaleString()} saints on
            map ({locations.length.toLocaleString()} location
            {locations.length !== 1 ? 's' : ''})
          </p>
        )}
        {error ? <p className="error">{error}</p> : null}
        {!loading && mappedCount === 0 && results.length > 0 ? (
          <p className="map-no-coords-notice">
            No coordinates available. Run <code>npm run geocode</code> then rebuild to populate
            the map.
          </p>
        ) : null}
      </section>

      <div className="map-container" aria-label="Interactive map of saint locations">
        <MapContainer
          center={[30, 10]}
          zoom={2}
          minZoom={2}
          maxZoom={18}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            subdomains="abcd"
            maxZoom={19}
          />
          {locations.map((loc) => (
            <CircleMarker
              key={`${loc.lat.toFixed(4)},${loc.lng.toFixed(4)}`}
              center={[loc.lat, loc.lng]}
              radius={markerRadius(loc.saints.length)}
              pathOptions={{
                color: '#b8942a',
                fillColor: '#d4af37',
                fillOpacity: 0.75,
                weight: 1.5,
              }}
            >
              <Popup maxWidth={320}>
                <div className="map-popup">
                  <p className="map-popup-location">{loc.label}</p>
                  <p className="map-popup-country">{loc.country}</p>
                  <p className="map-popup-count">
                    {loc.saints.length} saint{loc.saints.length !== 1 ? 's' : ''}
                  </p>
                  <ul className="map-popup-saints">
                    {loc.saints.slice(0, MAX_POPUP_SAINTS).map((s) => (
                      <li key={s.id}>{s.name}</li>
                    ))}
                    {loc.saints.length > MAX_POPUP_SAINTS ? (
                      <li className="map-popup-more">
                        …and {loc.saints.length - MAX_POPUP_SAINTS} more
                      </li>
                    ) : null}
                  </ul>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </>
  )
}
