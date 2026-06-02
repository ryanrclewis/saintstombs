import { useState } from 'react'
import '../styles/FloatingActionButton.css'
import type { LiturgicalColor } from '../utils/liturgicalTheme'

type ThemeMode = 'auto' | LiturgicalColor

interface FloatingActionButtonProps {
  onSearchClick: () => void
  themeMode: ThemeMode
  onThemeChange: (mode: ThemeMode) => void
  liturgicalLabel: string
}

const themeOptions: Array<{ value: ThemeMode; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'green', label: 'Green' },
  { value: 'purple', label: 'Purple' },
  { value: 'white', label: 'White' },
  { value: 'red', label: 'Red' },
  { value: 'rose', label: 'Rose' },
]

const SearchIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)

const PaletteIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
    <circle cx="9" cy="16" r="1" fill="currentColor" />
    <circle cx="15" cy="16" r="1" fill="currentColor" />
  </svg>
)

export function FloatingActionButton({
  onSearchClick,
  themeMode,
  onThemeChange,
  liturgicalLabel,
}: FloatingActionButtonProps) {
  const [showThemeMenu, setShowThemeMenu] = useState(false)

  return (
    <div className="fab-pill-container">
      <div className="fab-pill">
        <button
          className="fab-pill-action fab-search"
          onClick={() => {
            onSearchClick()
          }}
          aria-label="Open search"
          title="Search (⌘K)"
        >
          <SearchIcon />
        </button>

        <div className="fab-pill-divider" />

        <div className="fab-theme-wrapper">
          <button
            className="fab-pill-action fab-theme"
            onClick={() => {
              setShowThemeMenu(!showThemeMenu)
            }}
            aria-label="Open theme selector"
            title="Change theme"
            aria-expanded={showThemeMenu}
          >
            <PaletteIcon />
          </button>

          {showThemeMenu && (
            <div className="fab-theme-menu">
              <div className="fab-theme-header">
                <span className="fab-theme-title">Liturgical Theme</span>
                <span className="fab-theme-current">{liturgicalLabel}</span>
              </div>
              <div className="fab-theme-options">
                {themeOptions.map((option) => (
                  <button
                    key={option.value}
                    className={`fab-theme-option ${themeMode === option.value ? 'active' : ''}`}
                    onClick={() => {
                      onThemeChange(option.value)
                      setShowThemeMenu(false)
                    }}
                    aria-pressed={themeMode === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {showThemeMenu && (
            <div
              className="fab-theme-scrim"
              onClick={() => setShowThemeMenu(false)}
              aria-hidden="true"
            />
          )}
        </div>
      </div>
    </div>
  )
}
