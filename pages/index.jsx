import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Layout from '../components/Layout';

function animateValue(el, start, end, duration) {
  let startTimestamp = null;
  const step = (timestamp) => {
    if (!startTimestamp) startTimestamp = timestamp;
    const progress = Math.min((timestamp - startTimestamp) / duration, 1);
    el.innerHTML = Math.floor(progress * (end - start) + start).toLocaleString();
    if (progress < 1) {
      window.requestAnimationFrame(step);
    }
  };
  window.requestAnimationFrame(step);
}

function StatsSection() {
  const statsRef = useRef(null);
  const animated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !animated.current) {
            animated.current = true;
            const statEls = entry.target.querySelectorAll('.stat-number');
            statEls.forEach((el) => {
              const target = parseInt(el.getAttribute('data-target'), 10);
              animateValue(el, 0, target, 2000);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="stats" className="stats-section" aria-label="Statistics" ref={statsRef}>
      <div className="stat-item fade-in">
        <span className="stat-number" data-target="12061" aria-live="polite">0</span>
        <span className="stat-label">Saints and Holy Figures (Blesseds, Venerables, and Servants of God)</span>
      </div>
      <div className="stat-item fade-in delay-2">
        <span className="stat-number" data-target="5629" aria-live="polite">0</span>
        <span className="stat-label">Locations</span>
      </div>
      <div className="stat-item fade-in delay-1">
        <span className="stat-number" data-target="133" aria-live="polite">0</span>
        <span className="stat-label">Countries</span>
      </div>
    </section>
  );
}

function CardStack() {
  const [cardIndices, setCardIndices] = useState([0, 1, 2]);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef(null);
  const isHovering = useRef(false);

  const cards = [
    { name: 'St. Peter', location: 'Vatican City', img: '/st-peter.jpg' },
    { name: 'St. Thomas', location: 'Chennai, India', img: '/st-thomas.jpg' },
    { name: 'St. Francis', location: 'Assisi, Italy', img: '/st-francis.jpg' },
  ];

  function shuffleCards() {
    setCardIndices((prev) => {
      const next = [...prev];
      const last = next.pop();
      next.unshift(last);
      return next;
    });
  }

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const onMouseMove = (e) => {
      isHovering.current = true;
      setMousePos({ x: e.pageX, y: e.pageY });
    };
    const onMouseLeave = () => {
      isHovering.current = false;
      setMousePos({ x: 0, y: 0 });
    };

    hero.addEventListener('mousemove', onMouseMove);
    hero.addEventListener('mouseleave', onMouseLeave);
    return () => {
      hero.removeEventListener('mousemove', onMouseMove);
      hero.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  function getCardStyle(positionIndex) {
    if (!isHovering.current || (mousePos.x === 0 && mousePos.y === 0)) return {};
    const x = (window.innerWidth / 2 - mousePos.x) / 25;
    const y = (window.innerHeight / 2 - mousePos.y) / 25;
    const speed = (positionIndex + 1) * 0.5;
    return {
      transform: `translate(-50%, -50%) translate(${x * speed}px, ${y * speed}px) rotate(${positionIndex * 5 + x * 0.1}deg)`,
    };
  }

  return (
    <section className="hero" ref={heroRef}>
      <div className="hero-content">
        <h1 className="fade-in-up">Discover the <span className="text-gradient">Sacred</span></h1>
        <p className="fade-in-up delay-1">Journey through history to the final resting places of the world's most revered holy figures.</p>
        <div className="cta-group fade-in-up delay-2">
          <Link href="/saints" className="btn-primary">View the Saint&apos;s Tombs</Link>
          <Link href="/about" className="btn-secondary">About the Project</Link>
        </div>
      </div>
      <div className="hero-visual fade-in-left delay-1">
        <div
          className="card-stack"
          tabIndex={0}
          role="button"
          aria-label="Shuffle saint cards - Press Enter or Space to cycle through cards"
          onClick={shuffleCards}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              shuffleCards();
            }
          }}
        >
          {cards.map((card, index) => {
            const positionClass = `card-${cardIndices[index] + 1}`;
            return (
              <div
                key={card.name}
                className={`card ${positionClass}`}
                style={getCardStyle(cardIndices[index])}
              >
                <div className="card-content">
                  <h3>{card.name}</h3>
                  <p>{card.location}</p>
                </div>
                <img src={card.img} alt={card.name} />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Layout
      title="SaintsTombs.com"
      description="Discover the final resting places of saints and martyrs around the world."
      ogUrl="https://saintstombs.com/"
    >
      <div className="background-globes">
        <div className="globe globe-1"></div>
        <div className="globe globe-2"></div>
        <div className="globe globe-3"></div>
      </div>
      <main id="main-content">
        <CardStack />
        <StatsSection />
      </main>
    </Layout>
  );
}
