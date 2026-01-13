document.addEventListener('DOMContentLoaded', () => {
    const aboutContent = document.getElementById('about-content');

    async function loadAbout() {
        try {
            const response = await fetch('regions/about.md');
            if (!response.ok) throw new Error('Failed to fetch regions/about.md');
            const markdown = await response.text();

            const html = marked.parse(markdown);

            aboutContent.innerHTML = html;
            aboutContent.classList.add('fade-in');

        } catch (error) {
            console.error('Error loading about markdown:', error);
            aboutContent.innerHTML = `<div class="empty-state"><p>Error loading content. Please ensure you are viewing this via a web server.</p></div>`;
        }
    }

    loadAbout();
});
