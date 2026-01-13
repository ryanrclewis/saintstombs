document.addEventListener('DOMContentLoaded', () => {
    const regionSelect = document.getElementById('region-select');
    const resultsContainer = document.getElementById('results-container');

    // Configure marked to add IDs to headers for TOC linking
    const renderer = new marked.Renderer();
    renderer.heading = ({ text, depth, raw }) => {
        const id = raw.toLowerCase().replace(/[^\w]+/g, '-');
        return `<h${depth} id="${id}">${text}</h${depth}>`;
    };
    marked.setOptions({ renderer });

    async function loadMarkdown(filename) {
        if (!filename) {
            resultsContainer.innerHTML = `<div class="empty-state"><p>Select a region above to read about the saints.</p></div>`;
            return;
        }

        resultsContainer.innerHTML = `<div class="empty-state"><p>Loading ${filename}...</p></div>`;

        try {
            const response = await fetch(filename);
            if (!response.ok) throw new Error('Failed to fetch file');
            const markdown = await response.text();

            // Clean up markdown if needed (e.g. removing Liquid tags if they exist)
            // But for now, let's just parse it directly.
            const html = marked.parse(markdown);

            // Temporary container to extract headers
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;

            const h1Headers = tempDiv.querySelectorAll('h1');
            let tocHtml = '';

            if (h1Headers.length > 0) {
                tocHtml = `
                    <div class="toc-container glass">
                        <h3>Jump to Country</h3>
                        <div class="toc-links">
                            ${Array.from(h1Headers).map(h1 => `
                                <a href="#${h1.id}">${h1.textContent}</a>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            resultsContainer.innerHTML = tocHtml + html;
            resultsContainer.classList.add('fade-in');

            // Scroll to results on mobile
            if (window.innerWidth < 768) {
                resultsContainer.scrollIntoView({ behavior: 'smooth' });
            }

        } catch (error) {
            console.error('Error loading markdown:', error);
            resultsContainer.innerHTML = `<div class="empty-state"><p>Error loading content. Please ensure you are viewing this via a web server.</p></div>`;
        }
    }

    regionSelect.addEventListener('change', (e) => {
        loadMarkdown(e.target.value);
    });
});
