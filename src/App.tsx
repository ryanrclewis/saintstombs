import { useEffect, useState } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import './App.css'
import { AboutPage } from './pages/AboutPage'
import { ContactPage } from './pages/ContactPage'
import { DonatePage } from './pages/DonatePage'
import { HomePage } from './pages/HomePage'

const navItems = [
  { to: '/search', label: 'Search' },
  { to: '/about', label: 'About' },
  { to: '/donate', label: 'Donate' },
  { to: '/contact', label: 'Contact' },
]

function App() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setIsMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = isMobileNavOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobileNavOpen])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileNavOpen(false)
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

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
          onClick={() => setIsMobileNavOpen((open) => !open)}
        >
          {isMobileNavOpen ? '✕' : '☰'}
        </button>

        <nav
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
                    `${isActive ? 'nav-link active' : 'nav-link'} ${item.to === '/donate' ? 'nav-donate' : ''}`.trim()
                  }
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <main id="main-content" className="app-shell">
        <Routes>
          <Route path="/" element={<Navigate to="/search" replace />} />
          <Route path="/search" element={<HomePage />} />
          <Route path="/saints" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/donate" element={<DonatePage />} />
          <Route path="/contact" element={<ContactPage />} />
        </Routes>
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
    </>
  )
}

export default App
