import { Suspense, lazy, useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import { FloatingActionButton } from './components/FloatingActionButton'
import { HomePage } from './pages/HomePage'
import { getLiturgicalTheme, type LiturgicalColor } from './utils/liturgicalTheme'

const routeMetadata = {
  '/home': {
    title: 'SaintsTombs | Search Saints by Location',
    description:
      'Search the resting places of saints and martyrs by name, location, and region.',
  },
  '/saints': {
    title: 'SaintsTombs | Search Saints by Location',
    description:
      'Search the resting places of saints and martyrs by name, location, and region.',
  },
  '/regions': {
    title: 'Regions | SaintsTombs',
    description:
      'Browse saints and their resting places by geographic region.',
  },
  '/about': {
    title: 'About | SaintsTombs',
    description: 'Learn about the SaintsTombs project and its research mission.',
  },
  '/contact': {
    title: 'Contact | SaintsTombs',
    description: 'Contact SaintsTombs for corrections, additions, or general inquiries.',
  },
  '/donate': {
    title: 'Donate | SaintsTombs',
    description: 'Support SaintsTombs and help preserve information about sacred sites.',
  },
} as const

const RouteFallback = () => <div className="route-fallback" aria-hidden="true" />

const AboutPage = lazy(() =>
  import('./pages/AboutPage').then((module) => ({
    default: module.AboutPage,
  })),
)

const ContactPage = lazy(() =>
  import('./pages/ContactPage').then((module) => ({
    default: module.ContactPage,
  })),
)

const DonatePage = lazy(() =>
  import('./pages/DonatePage').then((module) => ({
    default: module.DonatePage,
  })),
)

const RegionsPage = lazy(() =>
  import('./pages/RegionsPage').then((module) => ({
    default: module.RegionsPage,
  })),
)

const GlobalSearchModal = lazy(() =>
  import('./components/GlobalSearchModal').then((module) => ({
    default: module.GlobalSearchModal,
  })),
)

const navItems = [
  { to: '/home', label: 'Home' },
  { to: '/regions', label: 'Regions' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
  { to: '/donate', label: 'Donate' },
]

type ThemeMode = 'auto' | LiturgicalColor

const THEME_OVERRIDE_STORAGE_KEY = 'liturgical-theme-override'

const manualSeasonLabels: Record<LiturgicalColor, string> = {
  green: 'Ordinary Time',
  purple: 'Advent / Lent',
  white: 'Christmas / Easter',
  red: 'Passion / Pentecost',
  rose: 'Gaudete / Laetare',
}

function getStoredThemeOverride(): ThemeMode {
  const stored = window.localStorage.getItem(THEME_OVERRIDE_STORAGE_KEY)
  if (
    stored === 'green' ||
    stored === 'purple' ||
    stored === 'white' ||
    stored === 'red' ||
    stored === 'rose'
  ) {
    return stored
  }
  return 'auto'
}

function App() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>(getStoredThemeOverride)
  const [liturgicalTheme, setLiturgicalTheme] = useState(() => getLiturgicalTheme(new Date()))
  const location = useLocation()

  useEffect(() => {
    setIsMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow =
      isMobileNavOpen || isSearchModalOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileNavOpen, isSearchModalOpen])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false)
        setIsSearchModalOpen(false)
      }

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setIsMobileNavOpen(false)
        setIsSearchModalOpen(true)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useEffect(() => {
    const metadata =
      routeMetadata[location.pathname as keyof typeof routeMetadata] ?? routeMetadata['/home']
    document.title = metadata.title

    const description = document.querySelector('meta[name="description"]')
    if (description) {
      description.setAttribute('content', metadata.description)
    }
  }, [location.pathname])

  useEffect(() => {
    if (themeMode === 'auto') {
      window.localStorage.removeItem(THEME_OVERRIDE_STORAGE_KEY)
    } else {
      window.localStorage.setItem(THEME_OVERRIDE_STORAGE_KEY, themeMode)
    }
  }, [themeMode])

  useEffect(() => {
    if (themeMode !== 'auto') {
      setLiturgicalTheme({
        color: themeMode,
        label: manualSeasonLabels[themeMode],
      })
      return
    }

    const applyTheme = () => {
      setLiturgicalTheme(getLiturgicalTheme(new Date()))
    }

    let dailyInterval: number | undefined
    applyTheme()

    const now = new Date()
    const nextMidnight = new Date(now)
    nextMidnight.setHours(24, 0, 0, 0)
    const timeoutMs = nextMidnight.getTime() - now.getTime()

    const midnightTimeout = window.setTimeout(() => {
      applyTheme()
      dailyInterval = window.setInterval(applyTheme, 24 * 60 * 60 * 1000)
    }, timeoutMs)

    return () => {
      window.clearTimeout(midnightTimeout)
      if (dailyInterval) {
        window.clearInterval(dailyInterval)
      }
    }
  }, [themeMode])

  useEffect(() => {
    document.documentElement.setAttribute('data-liturgical-color', liturgicalTheme.color)
  }, [liturgicalTheme.color])

  return (
    <>
      <div className="background-globes" aria-hidden="true" />
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <header className="glass-header">
        <NavLink to="/" className="logo-link" aria-label="Saints Tombs Home">
          <div className="logo">
            Saints<span>Tombs</span>
          </div>
        </NavLink>

        <button
          className="menu-toggle"
          aria-label="Toggle Navigation"
          aria-expanded={isMobileNavOpen}
          aria-controls="primary-navigation"
          onClick={() => setIsMobileNavOpen((open) => !open)}
        >
          {isMobileNavOpen ? '✕' : '☰'}
        </button>

        <nav
          id="primary-navigation"
          className={isMobileNavOpen ? 'top-nav active' : 'top-nav'}
          aria-label="Primary"
        >
          <ul className="nav-links">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end
                  className={({ isActive }) =>
                    `${isActive ? 'nav-link active' : 'nav-link'}${item.to === '/donate' ? ' nav-link-accent' : ''}`
                  }
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className={isMobileNavOpen ? 'nav-scrim active' : 'nav-scrim'}
          aria-label="Close navigation menu"
          tabIndex={isMobileNavOpen ? 0 : -1}
          onClick={() => setIsMobileNavOpen(false)}
        />
      </header>

      <main id="main-content" className="app-shell">
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/saints" element={<HomePage />} />
            <Route path="/regions" element={<RegionsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/donate" element={<DonatePage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </Suspense>
      </main>

      <footer>
        <p>
          BKO. ALL RIGHTS RESERVED. BUILT BY{' '}
          <a
            href="https://archangel-laboratories.com/"
            target="_blank"
            rel="noreferrer"
          >
            ARCHANGEL LABORATORIES
          </a>
          .
        </p>
      </footer>

      {isSearchModalOpen ? (
        <Suspense fallback={null}>
          <GlobalSearchModal
            isOpen={isSearchModalOpen}
            onClose={() => setIsSearchModalOpen(false)}
          />
        </Suspense>
      ) : null}

      <FloatingActionButton
        onSearchClick={() => setIsSearchModalOpen(true)}
        themeMode={themeMode}
        onThemeChange={setThemeMode}
        liturgicalLabel={liturgicalTheme.label}
      />
    </>
  )
}

export default App
