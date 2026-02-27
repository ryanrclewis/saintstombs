/**
 * search.js — frontend logic for search.html
 *
 * Queries the Cloudflare Workers search endpoint and renders results.
 * Replace WORKER_URL with your deployed Worker URL after setup.
 */

const WORKER_URL = 'saintstombs-search.ryanrclewis.workers.dev';

if (WORKER_URL.includes('<YOUR_SUBDOMAIN>')) {
    console.warn(
        'SaintsTombs: WORKER_URL is not configured. ' +
        'Open search.js and replace <YOUR_SUBDOMAIN> with your Cloudflare Workers subdomain.'
    );
}

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('search-form');
    const input = document.getElementById('search-input');
    const regionFilter = document.getElementById('region-filter');
    const resultsContainer = document.getElementById('search-results');

    // Pre-fill from URL params (supports bookmarking / sharing)
    const params = new URLSearchParams(window.location.search);
    if (params.get('q')) {
        input.value = params.get('q');
    }

    // Load region list from Worker
    loadRegions();

    // Auto-search if query params present
    if (params.get('q')) {
        doSearch(params.get('q'), params.get('region') || '');
    }

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const q = input.value.trim();
        if (!q) return;
        const region = regionFilter.value;

        // Update URL bar without reload
        const newParams = new URLSearchParams({ q });
        if (region) newParams.set('region', region);
        history.replaceState(null, '', `?${newParams}`);

        doSearch(q, region);
    });

    async function loadRegions() {
        try {
            const res = await fetch(`${WORKER_URL}/regions`);
            if (!res.ok) return;
            const { regions } = await res.json();
            regions.forEach((r) => {
                const opt = document.createElement('option');
                opt.value = r;
                opt.textContent = r;
                regionFilter.appendChild(opt);
            });
            // Restore region selection from URL
            if (params.get('region')) {
                regionFilter.value = params.get('region');
            }
        } catch {
            // Worker not yet deployed — silently skip
        }
    }

    async function doSearch(q, region) {
        resultsContainer.innerHTML = '<div class="empty-state"><p>Searching…</p></div>';

        const url = new URL(`${WORKER_URL}/search`);
        url.searchParams.set('q', q);
        if (region) url.searchParams.set('region', region);

        try {
            const res = await fetch(url.toString());
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `HTTP ${res.status}`);
            }
            const data = await res.json();
            renderResults(data);
        } catch (err) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <p>Search unavailable: ${escapeHtml(err.message)}</p>
                    <p style="margin-top:0.5rem;font-size:0.85rem;color:var(--text-secondary)">
                        Make sure the Cloudflare Worker is deployed and the WORKER_URL
                        in search.js points to your worker.
                    </p>
                </div>`;
        }
    }

    function renderResults({ query, results }) {
        if (!results || results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <p>No results found for <strong>${escapeHtml(query)}</strong>.</p>
                </div>`;
            return;
        }

        const count = results.length;
        let html = `<p class="search-summary">${count} result${count !== 1 ? 's' : ''} for <strong>${escapeHtml(query)}</strong></p>`;
        html += '<ul class="search-result-list">';

        for (const row of results) {
            html += `
                <li class="search-result-item">
                    <div class="result-entry">${escapeHtml(row.entry)}</div>
                    <div class="result-meta">
                        <span class="result-church">${escapeHtml(row.church || '—')}</span>
                        <span class="result-sep">·</span>
                        <span class="result-location">${escapeHtml(row.location)}</span>
                        <span class="result-sep">·</span>
                        <span class="result-region">${escapeHtml(row.region)}</span>
                    </div>
                </li>`;
        }

        html += '</ul>';
        resultsContainer.innerHTML = html;
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
});
