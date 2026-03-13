import { useEffect, useState } from 'react';
import { marked } from 'marked';
import Layout from '../components/Layout';

export default function About() {
  const [content, setContent] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadAbout() {
      try {
        const response = await fetch('/regions/about.md');
        if (!response.ok) throw new Error('Failed to fetch');
        const markdown = await response.text();
        setContent(marked.parse(markdown));
      } catch {
        setError(true);
      }
    }
    loadAbout();
  }, []);

  return (
    <Layout
      title="SaintsTombs - About"
      description="Learn about the SaintsTombs project - a comprehensive guide to the resting places of saints and holy figures worldwide."
      ogUrl="https://saintstombs.com/about"
      activePage="about"
    >
      <main className="explorer-container" id="main-content">
        <header className="explorer-header">
          <h1 className="text-gradient">About SaintsTombs</h1>
          <p>Our mission and the story behind the data.</p>
        </header>
        <section className="markdown-content glass">
          {error ? (
            <div className="empty-state"><p>Error loading content.</p></div>
          ) : content ? (
            <div className="fade-in" dangerouslySetInnerHTML={{ __html: content }} />
          ) : (
            <div className="empty-state"><p>Loading about information...</p></div>
          )}
        </section>
      </main>
      <div className="background-overlay"></div>
    </Layout>
  );
}
