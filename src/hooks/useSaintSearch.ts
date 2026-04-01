import { useDeferredValue, useEffect, useMemo, useState } from 'react'

export type Saint = {
  id: string
  name: string
  country: string
  continent: string
  city_or_region: string
  tags?: string[]
  keywords?: string
  summary: string
  lat?: number
  lng?: number
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
  saints: PreparedSaint[]
  filters: FiltersData
}

type PreparedSaint = Saint & {
  normalizedSearchText: string
}

let dataPromise: Promise<SearchData> | null = null
const saintNameCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
})

const normalizeSortValue = (value: string) =>
  value.trim().normalize('NFD').replace(/\p{M}/gu, '')

const getSortBucket = (value: string) =>
  /^\p{L}/u.test(normalizeSortValue(value)) ? 0 : 1

const compareSaintNames = (left: PreparedSaint, right: PreparedSaint) => {
  const leftBucket = getSortBucket(left.name)
  const rightBucket = getSortBucket(right.name)

  if (leftBucket !== rightBucket) {
    return leftBucket - rightBucket
  }

  return saintNameCollator.compare(
    normalizeSortValue(left.name),
    normalizeSortValue(right.name),
  )
}

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
      const preparedSaints: PreparedSaint[] = saints.map((saint) => ({
        ...saint,
        tags: saint.tags ?? [],
        normalizedSearchText: [
          saint.name,
          saint.country,
          saint.continent,
          saint.city_or_region,
          ...(saint.tags ?? []),
          saint.keywords ?? '',
        ]
          .join(' ')
          .toLowerCase(),
      }))
      preparedSaints.sort(compareSaintNames)
      return { saints: preparedSaints, filters }
    })()
  }

  return dataPromise
}

export function useSaintSearch() {
  const [saints, setSaints] = useState<PreparedSaint[]>([])
  const [filters, setFilters] = useState<FiltersData>(DEFAULT_FILTERS)
  const [query, setQuery] = useState('')
  const [continent, setContinent] = useState('All')
  const [country, setCountry] = useState('All')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const deferredQuery = useDeferredValue(query)

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
    const normalizedQuery = deferredQuery.trim().toLowerCase()

    return saints.filter((saint) => {
      const queryMatch =
        normalizedQuery.length === 0 || saint.normalizedSearchText.includes(normalizedQuery)
      const continentMatch = continent === 'All' || saint.continent === continent
      const countryMatch = country === 'All' || saint.country === country

      return queryMatch && continentMatch && countryMatch
    })
  }, [continent, country, deferredQuery, saints])

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
