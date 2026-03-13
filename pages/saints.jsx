import { useEffect, useState } from 'react';
import { marked } from 'marked';
import Layout from '../components/Layout';

const REGIONS = [
  { label: 'Africa', file: 'africa.md' },
  { label: 'Asia', file: 'asia.md' },
  { label: 'Austria', file: 'austria.md' },
  { label: 'Belgium', file: 'belgium.md' },
  { label: 'Britain', file: 'britain.md' },
  { label: 'Eastern Europe', file: 'eastern-europe.md' },
  { label: 'France', file: 'france.md' },
  { label: 'Germany', file: 'germany.md' },
  { label: 'Ireland', file: 'ireland.md' },
  { label: 'Italy', file: 'italy.md' },
  { label: 'Latin America', file: 'latin-america.md' },
  { label: 'Netherlands', file: 'netherlands.md' },
  { label: 'North America', file: 'north-america.md' },
  { label: 'Oceania', file: 'oceania.md' },
  { label: 'Portugal', file: 'portugal.md' },
  { label: 'Scandinavia', file: 'scandinavia.md' },
  { label: 'Spain', file: 'spain.md' },
  { label: 'Switzerland', file: 'switzerland.md' },
];

const renderer = new marked.Renderer();
renderer.heading = ({ text, depth, raw }) => {
  const id = raw.toLowerCase().replace(/[^\w]+/g, '-');
  return `<h${depth} id="${id}">${text}</h${depth}>`;
};
marked.setOptions({ renderer });

export default function Saints() {
  const [selected, setSelected] = useState('');
  const [html, setHtml] = useState('');
  const [toc, setToc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function loadRegion(file) {
    if (!file) {
      setHtml('');
      setToc('');
      return;
    }

    setLoading(true);
    setError(false);

    try {
      const response = await fetch(`/regions/${file}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const markdown = await response.text();
      const parsed = marked.parse(markdown);

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = parsed;

      const isItaly = file.toLowerCase().includes('italy');
      const h1Headers = tempDiv.querySelectorAll('h1');
      let tocHtml = '';

      if (!isItaly && h1Headers.length > 0) {
        tocHtml = `
          <div class="toc-container glass">
            <h3>Jump to Country</h3>
            <div class="toc-links">
              ${Array.from(h1Headers).map((h1) => `<a href="#${h1.id}">${h1.textContent}</a>`).join('')}
            </div>
          </div>
        `;
      }

      setToc(tocHtml);
      setHtml(tempDiv.innerHTML);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    const file = e.target.value;
    setSelected(file);
    loadRegion(file);
  }

  return (
    <Layout
      title="SaintsTombs - Explore"
      description="Explore the locations and stories of saints and martyrs from around the world. Journey through history to discover sacred pilgrimage sites."
      ogUrl="https://saintstombs.com/saints"
      activePage="saints"
    >
      <main className="explorer-container" id="main-content">
        <header className="explorer-header">
          <h1 className="text-gradient">Explore Holy Graves</h1>
          <p>Select a region to discover the saints buried there.</p>
        </header>

        <section className="explorer-controls glass">
          <div className="filter-group">
            <label htmlFor="region-select">Region / Continent</label>
            <select id="region-select" value={selected} onChange={handleChange}>
              <option value="">Select Region</option>
              {REGIONS.map((r) => (
                <option key={r.file} value={r.file}>{r.label}</option>
              ))}
            </select>
          </div>
        </section>

        <section className="markdown-content glass">
          {loading && (
            <div className="empty-state"><p>Loading...</p></div>
          )}
          {error && (
            <div className="empty-state"><p>Error loading content.</p></div>
          )}
          {!loading && !error && !html && (
            <div className="empty-state"><p>Select a region above to read about the saints.</p></div>
          )}
          {!loading && !error && html && (
            <div
              className="fade-in"
              dangerouslySetInnerHTML={{ __html: toc + html }}
            />
          )}
        </section>
      </main>
      <div className="background-overlay"></div>
    </Layout>
  );
}
