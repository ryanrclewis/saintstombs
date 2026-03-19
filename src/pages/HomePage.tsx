import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const SAINT_CARDS = [
  { name: 'St. Peter', location: 'Vatican City', img: '/st-peter.jpg' },
  { name: 'St. Thomas', location: 'Chennai, India', img: '/st-thomas.jpg' },
  { name: 'St. Francis', location: 'Assisi, Italy', img: '/st-francis.jpg' },
]

const STATS = [
  { target: 12061, label: 'Saints and Holy Figures (Blesseds, Venerables, and Servants of God)' },
  { target: 5629, label: 'Locations' },
  { target: 133, label: 'Countries' },
]

function useCountUp(target: number, duration: number, active: boolean) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (!active) return
    startRef.current = null
    const step = (timestamp: number) => {
      if (startRef.current === null) startRef.current = timestamp
      const progress = Math.min((timestamp - startRef.current) / duration, 1)
      setValue(Math.floor(progress * target))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step)
      } else {
        setValue(target)
      }
    }
    rafRef.current = requestAnimationFrame(step)
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [target, duration, active])

  return value
}

function StatItem({ target, label }: { target: number; label: string }) {
  const ref = useRef<HTMLDivElement | null>(null)
  const [active, setActive] = useState(false)
  const value = useCountUp(target, 2000, active)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          observer.unobserve(el)
        }
      },
      { threshold: 0.5 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="stat-item">
      <span className="stat-number" aria-live="polite">
        {value.toLocaleString()}
      </span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

export function HomePage() {
  const [cardIndices, setCardIndices] = useState([0, 1, 2])
  const heroRef = useRef<HTMLElement | null>(null)

  const shuffleCards = () => {
    setCardIndices((prev) => {
      const next = [...prev]
      const last = next.pop()!
      next.unshift(last)
      return next
    })
  }

  const handleParallax = (event: React.MouseEvent<HTMLElement>) => {
    const cards = heroRef.current?.querySelectorAll<HTMLElement>('.home-card')
    if (!cards) return
    const x = (window.innerWidth / 2 - event.pageX) / 25
    const y = (window.innerHeight / 2 - event.pageY) / 25
    cards.forEach((card, index) => {
      const speed = (index + 1) * 0.5
      card.style.transform = `translate(-50%, -50%) translate(${x * speed}px, ${y * speed}px) rotate(${index * 5 + x * 0.1}deg)`
    })
  }

  const handleParallaxLeave = () => {
    const cards = heroRef.current?.querySelectorAll<HTMLElement>('.home-card')
    if (!cards) return
    cards.forEach((card) => {
      card.style.transform = ''
    })
  }

  return (
    <>
      <section
        ref={heroRef}
        className="home-hero"
        onMouseMove={handleParallax}
        onMouseLeave={handleParallaxLeave}
      >
        <div className="home-hero-content">
          <h1 className="home-hero-title">
            Discover the <span className="text-gradient">Sacred</span>
          </h1>
          <p className="home-hero-sub">
            Journey through history to the final resting places of the world's most revered holy
            figures.
          </p>
          <div className="home-cta-group">
            <Link to="/saints" className="btn-primary">
              View the Saints' Tombs
            </Link>
            <Link to="/about" className="btn-secondary">
              About the Project
            </Link>
          </div>
        </div>

        <div className="home-hero-visual">
          <div
            className="home-card-stack"
            role="button"
            tabIndex={0}
            aria-label="Shuffle saint cards — press Enter or Space to cycle"
            onClick={shuffleCards}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                shuffleCards()
              }
            }}
          >
            {SAINT_CARDS.map((saint, index) => {
              const posClass = `home-card-pos-${cardIndices[index] + 1}`
              return (
                <div key={saint.name} className={`home-card ${posClass}`}>
                  <div className="home-card-content">
                    <h3>{saint.name}</h3>
                    <p>{saint.location}</p>
                  </div>
                  <img src={saint.img} alt={saint.name} />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="home-stats" aria-label="Statistics">
        {STATS.map((stat) => (
          <StatItem key={stat.label} target={stat.target} label={stat.label} />
        ))}
      </section>
    </>
  )
}
