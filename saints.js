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

            const h1Groups = [];
            let currentGroup = null;

            // Group elements by Country (H1)
            Array.from(tempDiv.children).forEach(el => {
                if (el.tagName === 'H1') {
                    currentGroup = { h1: el, items: [] };
                    h1Groups.push(currentGroup);
                } else if (currentGroup) {
                    currentGroup.items.push(el);
                }
            });

            // Process each country group to add IDs and build sub-TOCs
            /* h1Groups.forEach((group, gIdx) => {
                const subTocLinks = [];
                const countryId = group.h1.id;

                group.items.forEach((el, iIdx) => {
                    if (el.tagName === 'P') {
                        // Likely a Town
                        const text = el.textContent.trim();
                        if (text && text.length > 1) {
                            const townId = `${countryId}-${text.toLowerCase().replace(/[^\w]+/g, '-')}`;
                            el.id = townId;
                            subTocLinks.push(`<a href="#${townId}" class="sub-toc-pill town-pill">${text}</a>`);
                        }
                    } else if (el.tagName === 'UL') {
                        // Likely a list of sites
                        Array.from(el.children).forEach((li, lIdx) => {
                            if (li.parentElement === el) {
                                // Extract site name (first text node normally)
                                const siteText = li.childNodes[0].textContent.trim().replace(/^[-*+]\s+/, '');
                                if (siteText && siteText !== '???' && siteText.length > 2) {
                                    const siteId = `${countryId}-site-${gIdx}-${iIdx}-${lIdx}`;
                                    li.id = siteId;
                                    subTocLinks.push(`<a href="#${siteId}" class="sub-toc-pill site-pill">${siteText}</a>`);
                                }
                            }
                        });
                    }
                });

                if (subTocLinks.length > 0) {
                    const subToc = document.createElement('div');
                    subToc.className = 'sub-toc-container glass';
                    subToc.innerHTML = `
                        <div class="sub-toc-label">Jump to:</div>
                        <div class="sub-toc-links">
                            ${subTocLinks.join('')}
                        </div>
                    `;
                    group.h1.after(subToc);
                }
            }); */

            const finalHtml = tempDiv.innerHTML;
            const h1Headers = tempDiv.querySelectorAll('h1');
            let tocHtml = '';

            // Do not render the "Jump to Country" TOC for the Italy file
            const isItalyFile = typeof filename === 'string' && filename.toLowerCase().includes('italy');

            if (!isItalyFile && h1Headers.length > 0) {
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

            resultsContainer.innerHTML = tocHtml + finalHtml;
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
