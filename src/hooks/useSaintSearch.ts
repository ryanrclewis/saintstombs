import { useEffect, useMemo, useState } from 'react'

export type Saint = {
  id: string
  name: string
  feast_day: string
  country: string
  continent: string
  city_or_region: string
  tags: string[]
  aliases: string[]
  summary: string
  source: string
  search_text: string
}

type FiltersData = {
  continents: string[]
  countriesByContinent: Record<string, string[]>
}

const DEFAULT_FILTERS: FiltersData = {
  continents: [],
  countriesByContinent: {},
}

type SearchData = {
  saints: Saint[]
  filters: FiltersData
}

let dataPromise: Promise<SearchData> | null = null

const loadSearchData = async (): Promise<SearchData> => {
  if (!dataPromise) {
    dataPromise = (async () => {
      const [saintsResponse, filtersResponse] = await Promise.all([
        fetch('/data/saints.json'),
        fetch('/data/filters.json'),
      ])

      if (!saintsResponse.ok || !filtersResponse.ok) {
        throw new Error('Failed to load saints dataset.')
      }

      const saints = (await saintsResponse.json()) as Saint[]
      const filters = (await filtersResponse.json()) as FiltersData
      return { saints, filters }
    })()
  }

  return dataPromise
}

export function useSaintSearch() {
  const [saints, setSaints] = useState<Saint[]>([])
  const [filters, setFilters] = useState<FiltersData>(DEFAULT_FILTERS)
  const [query, setQuery] = useState('')
  const [continent, setContinent] = useState('All')
  const [country, setCountry] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await loadSearchData()
        setSaints(data.saints)
        setFilters(data.filters)
      } catch (loadError) {
        setError(
          loadError instanceof Error ? loadError.message : 'Unknown error occurred.',
        )
      } finally {
        setLoading(false)
      }
    }

    void loadData()
  }, [])

  const countries = useMemo(() => {
    if (continent === 'All') {
      const allCountries = new Set<string>()
      Object.values(filters.countriesByContinent).forEach((entries) => {
        entries.forEach((entry) => allCountries.add(entry))
      })
      return Array.from(allCountries).sort((a, b) => a.localeCompare(b))
    }
    return filters.countriesByContinent[continent] ?? []
  }, [continent, filters])

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return saints.filter((saint) => {
      const queryMatch =
        normalizedQuery.length === 0 ||
        saint.search_text.toLowerCase().includes(normalizedQuery)
      const continentMatch = continent === 'All' || saint.continent === continent
      const countryMatch = country === 'All' || saint.country === country

      return queryMatch && continentMatch && countryMatch
    })
  }, [continent, country, query, saints])

  const handleContinentChange = (value: string) => {
    setContinent(value)
    setCountry('All')
  }

  return {
    countries,
    continent,
    country,
    error,
    filters,
    handleContinentChange,
    loading,
    query,
    results,
    setCountry,
    setQuery,
  }
}
