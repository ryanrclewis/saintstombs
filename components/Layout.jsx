import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Layout({ children, title = 'SaintsTombs.com', description = 'Discover the final resting places of saints and martyrs around the world.', ogUrl = 'https://saintstombs.com/', activePage = '' }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
  }, [menuOpen]);

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:image" content="https://saintstombs.com/cover.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={ogUrl} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content="https://saintstombs.com/cover.png" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Texturina:ital,opsz,wght@0,12..72,100..900;1,12..72,100..900&display=swap" rel="stylesheet" />
      </Head>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <header className="glass-header">
        <Link href="/" className="logo-link">
          <div className="logo">Saints<span>Tombs</span></div>
        </Link>
        <button
          className={`menu-toggle${menuOpen ? ' active' : ''}`}
          aria-label="Toggle Navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? '✕' : '☰'}
        </button>
        <nav className={menuOpen ? 'active' : ''}>
          <ul className="nav-links">
            <li><Link href="/about" className={activePage === 'about' ? 'active' : ''} onClick={() => setMenuOpen(false)}>About</Link></li>
            <li><Link href="/saints" className={activePage === 'saints' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Explore</Link></li>
            <li><Link href="/search" className={activePage === 'search' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Search</Link></li>
            <li><Link href="/contact" className={activePage === 'contact' ? 'active' : ''} onClick={() => setMenuOpen(false)}>Contact</Link></li>
            <li><Link href="/donate" className={`nav-donate${activePage === 'donate' ? ' active' : ''}`} onClick={() => setMenuOpen(false)}>Donate</Link></li>
          </ul>
        </nav>
      </header>
      {children}
      <footer className="glass">
        <p>BKO. ALL RIGHTS RESERVED. BUILT BY <a href="https://archangel-laboratories.com/" target="_blank" rel="noopener noreferrer" aria-label="Archangel Laboratories (opens in new window)">ARCHANGEL LABORATORIES</a>.</p>
      </footer>
    </>
  );
}
