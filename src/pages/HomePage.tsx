import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import './HomePage.css'

const FEATURED_SAINTS = [
  { name: 'St. Peter', location: 'Vatican City', img: '/st-peter.jpg' },
  { name: 'St. Thomas', location: 'Chennai, India', img: '/st-thomas.jpg' },
  { name: 'St. Francis', location: 'Assisi, Italy', img: '/st-francis.jpg', imgPosition: 'center 30%' },
  { name: 'Ven. Theresia Ysseldijk, DCJ', location: 'Wauwatosa, Wisconsin', img: '/ven-theresia.jpg' },
  { name: 'Ven. Guido Schäffer', location: 'Rio de Janeiro, Brazil', img: '/ven-guido.jpg' },
  { name: 'Ven. Mary Glowrey, JM', location: 'Guntur, India', img: '/ven-mary-glowrey.jpg' },
]

const CARD_COUNT = FEATURED_SAINTS.length

const STATS = [
  { value: 12061, label: 'Saints and Holy Figures', sublabel: 'Blesseds, Venerables, and Servants of God' },
  { value: 5629, label: 'Locations', sublabel: 'Shrines, tombs, and sacred sites' },
  { value: 133, label: 'Countries', sublabel: 'Spanning every continent' },
]

function useCountUp(target: number, active: boolean, duration = 1800) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!active) return
    let start: number | null = null
    let raf: number
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [active, target, duration])
  return count
}

function StatCounter({ value, label, sublabel, active }: { value: number; label: string; sublabel: string; active: boolean }) {
  const count = useCountUp(value, active)
  return (
    <div className="home-stat">
      <span className="home-stat-value">{count.toLocaleString()}</span>
      <span className="home-stat-label">{label}</span>
      <span className="home-stat-sublabel">{sublabel}</span>
    </div>
  )
}

export function HomePage() {
  // cardOrder[i] = 1-based position class for card at index i
  const [cardOrder, setCardOrder] = useState<number[]>(() =>
    Array.from({ length: CARD_COUNT }, (_, i) => i + 1),
  )
  const heroRef = useRef<HTMLElement>(null)
  const cardsRef = useRef<(HTMLDivElement | null)[]>([])
  const statsRef = useRef<HTMLElement>(null)
  const [statsVisible, setStatsVisible] = useState(false)

  const shuffle = useCallback(() => {
    setCardOrder((prev) => {
      const next = [...prev]
      const last = next.pop()!
      next.unshift(last)
      return next
    })
  }, [])

  // Parallax on mousemove
  useEffect(() => {
    const hero = heroRef.current
    if (!hero) return

    const onMove = (e: MouseEvent) => {
      const x = (window.innerWidth / 2 - e.pageX) / 40
      const y = (window.innerHeight / 2 - e.pageY) / 40
      cardsRef.current.forEach((card, index) => {
        if (!card) return
        const speed = (index + 1) * 0.3
        card.style.setProperty('--parallax-x', `${x * speed}px`)
        card.style.setProperty('--parallax-y', `${y * speed}px`)
      })
    }

    const onLeave = () => {
      cardsRef.current.forEach((card) => {
        if (!card) return
        card.style.setProperty('--parallax-x', '0px')
        card.style.setProperty('--parallax-y', '0px')
      })
    }

    hero.addEventListener('mousemove', onMove)
    hero.addEventListener('mouseleave', onLeave)
    return () => {
      hero.removeEventListener('mousemove', onMove)
      hero.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  // Stats intersection observer
  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true) },
      { threshold: 0.2 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <section className="home-hero" ref={heroRef}>
        <div className="home-hero-content">
          <p className="eyebrow">Discover the Sacred</p>
          <h1>Saints<span>Tombs</span></h1>
          <p className="home-hero-subhead">
            Journey through history to the final resting places of the world's most revered
            holy figures, shrines, and other holy places.
          </p>
          <div className="home-hero-ctas">
            <Link to="/saints" className="home-cta-primary">View the Saint's Tombs</Link>
            <Link to="/about" className="home-cta-secondary">About the Project</Link>
          </div>
        </div>

        <div className="home-hero-visual">
          <div
            className="card-stack"
            role="button"
            tabIndex={0}
            aria-label="Shuffle saint cards — press Enter or Space to cycle through cards"
            onClick={shuffle}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); shuffle() } }}
          >
            {FEATURED_SAINTS.map((saint, index) => (
              <div
                key={saint.name}
                ref={(el) => { cardsRef.current[index] = el }}
                className={`card card-pos-${cardOrder[index]}`}
              >
                <img src={saint.img} alt={saint.name} style={saint.imgPosition ? { objectPosition: saint.imgPosition } : undefined} />
                <div className="card-content">
                  <h3>{saint.name}</h3>
                  <p className="card-location">{saint.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="home-stats" ref={statsRef} aria-label="Database statistics">
        {STATS.map((stat) => (
          <StatCounter key={stat.label} {...stat} active={statsVisible} />
        ))}
      </section>
    </>
  )
}
