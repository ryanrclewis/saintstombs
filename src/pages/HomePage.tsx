import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'

const heroCards = [
  {
    name: 'St. Peter',
    location: 'Vatican City',
    note: 'Basilica of Saint Peter, one of the most venerated apostolic burial sites.',
  },
  {
    name: 'St. Thomas',
    location: 'Chennai, India',
    note: 'Traditional resting place linked to the apostle mission in India.',
  },
  {
    name: 'St. Francis',
    location: 'Assisi, Italy',
    note: 'A major pilgrimage destination preserving Franciscan heritage.',
  },
] as const

const stats = [
  {
    value: '12061',
    label: 'Saints and holy figures (Blesseds, Venerables, and Servants of God)',
  },
  {
    value: '5629',
    label: 'Locations',
  },
  {
    value: '133',
    label: 'Countries',
  },
] as const

export function HomePage() {
  const [activeCardIndex, setActiveCardIndex] = useState(0)

  const orderedCards = useMemo(() => {
    return heroCards.map((_, offset) => heroCards[(activeCardIndex + offset) % heroCards.length])
  }, [activeCardIndex])

  const advanceCards = () => {
    setActiveCardIndex((index) => (index + 1) % heroCards.length)
  }

  return (
    <>
      <section className="home-hero" aria-label="Introduction">
        <div className="home-hero-content">
          <h1>
            Discover the <span className="text-gradient">Sacred</span>
          </h1>
          <p>
            Journey through history to the final resting places of the world's most revered holy
            figures.
          </p>
          <div className="home-cta-group">
            <NavLink to="/saints" className="btn-primary">
              View the Saint&apos;s Tombs
            </NavLink>
            <NavLink to="/about" className="btn-secondary">
              About the Project
            </NavLink>
          </div>
        </div>

        <div className="home-hero-visual">
          <button
            type="button"
            className="home-card-stack"
            onClick={advanceCards}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                advanceCards()
              }
            }}
            aria-label="Cycle through featured saint cards"
          >
            {orderedCards.map((card, index) => (
              <article
                key={card.name}
                className={`home-card home-card-${index + 1}`}
                aria-hidden={index > 0}
              >
                <h3>{card.name}</h3>
                <p className="home-card-location">{card.location}</p>
                <p>{card.note}</p>
              </article>
            ))}
          </button>
        </div>
      </section>

      <section className="stats-section" aria-label="Statistics">
        {stats.map((stat) => (
          <article key={stat.label} className="stat-item">
            <p className="stat-number">{stat.value}</p>
            <p className="stat-label">{stat.label}</p>
          </article>
        ))}
      </section>

      <section className="home-quick-links" aria-label="Explore">
        <h2>Begin Your Pilgrimage</h2>
        <p>
          Use the dedicated search experience to filter by continent, country, and text matches
          across the saints index.
        </p>
        <NavLink to="/search" className="btn-primary">
          Open Search
        </NavLink>
      </section>
    </>
  )
}
