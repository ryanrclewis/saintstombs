/**
 * search.js — frontend logic for search.html
 *
 * When WORKER_URL is configured (placeholder replaced after Worker deployment),
 * queries are sent to the Cloudflare Workers + D1 endpoint.
 *
 * Otherwise, falls back to client-side search by fetching and parsing the
 * same markdown region files used by the rest of the site — so search works
 * immediately without any backend deployment.
 */

const WORKER_URL = 'https://saintstombs-search.<YOUR_SUBDOMAIN>.workers.dev';
const USE_WORKER = !WORKER_URL.includes('<YOUR_SUBDOMAIN>');

// All region files in display order (must stay in sync with saints.html options)
const REGION_FILES = [
    { label: 'Africa',         file: 'africa.md' },
    { label: 'Asia',           file: 'asia.md' },
    { label: 'Austria',        file: 'austria.md' },
    { label: 'Belgium',        file: 'belgium.md' },
    { label: 'Britain',        file: 'britain.md' },
    { label: 'Eastern Europe', file: 'eastern-europe.md' },
    { label: 'France',         file: 'france.md' },
    { label: 'Germany',        file: 'germany.md' },
    { label: 'Ireland',        file: 'ireland.md' },
    { label: 'Italy',          file: 'italy.md' },
    { label: 'Latin America',  file: 'latin-america.md' },
    { label: 'Netherlands',    file: 'netherlands.md' },
    { label: 'North America',  file: 'north-america.md' },
    { label: 'Oceania',        file: 'oceania.md' },
    { label: 'Portugal',       file: 'portugal.md' },
    { label: 'Scandinavia',    file: 'scandinavia.md' },
    { label: 'Spain',          file: 'spain.md' },
    { label: 'Switzerland',    file: 'switzerland.md' },
];

// In-memory cache of parsed entries per region file
const contentCache = {};

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('search-form');
    const input = document.getElementById('search-input');
    const regionFilter = document.getElementById('region-filter');
    const resultsContainer = document.getElementById('search-results');

    // Pre-fill query input from URL params (supports bookmarking / sharing)
    const params = new URLSearchParams(window.location.search);
    if (params.get('q')) input.value = params.get('q');

    // Populate region dropdown — also restores the region param once options exist
    if (USE_WORKER) {
        loadRegionsFromWorker();
    } else {
        populateRegionDropdown(REGION_FILES.map((r) => r.label));
    }

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

    // -------------------------------------------------------------------------
    // Region dropdown
    // -------------------------------------------------------------------------
    async function loadRegionsFromWorker() {
        try {
            const res = await fetch(`${WORKER_URL}/regions`);
            if (!res.ok) throw new Error('Worker unavailable');
            const { regions } = await res.json();
            populateRegionDropdown(regions);
        } catch {
            // Worker not reachable — use local list
            populateRegionDropdown(REGION_FILES.map((r) => r.label));
        }
    }

    function populateRegionDropdown(regions) {
        regionFilter.innerHTML = '<option value="">All Regions</option>';
        regions.forEach((r) => {
            const opt = document.createElement('option');
            opt.value = r;
            opt.textContent = r;
            regionFilter.appendChild(opt);
        });
        // Restore region selection from URL now that the options exist
        const savedRegion = new URLSearchParams(window.location.search).get('region');
        if (savedRegion) regionFilter.value = savedRegion;
    }

    // -------------------------------------------------------------------------
    // Search dispatch
    // -------------------------------------------------------------------------
    async function doSearch(q, region) {
        resultsContainer.innerHTML = '<div class="empty-state"><p>Searching…</p></div>';
        try {
            if (USE_WORKER) {
                await workerSearch(q, region);
            } else {
                await clientSearch(q, region);
            }
        } catch (err) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <p>Search error: ${escapeHtml(err.message)}</p>
                </div>`;
        }
    }

    // -------------------------------------------------------------------------
    // Worker-based search (used when WORKER_URL is configured)
    // -------------------------------------------------------------------------
    async function workerSearch(q, region) {
        const url = new URL(`${WORKER_URL}/search`);
        url.searchParams.set('q', q);
        if (region) url.searchParams.set('region', region);

        const res = await fetch(url.toString());
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${res.status}`);
        }
        const data = await res.json();
        renderResults(data.query, data.results);
    }

    // -------------------------------------------------------------------------
    // Client-side search (default until Worker is deployed)
    // Parses the same markdown files served by the site and does in-memory
    // multi-term substring matching.
    // -------------------------------------------------------------------------
    async function clientSearch(q, region) {
        const filesToSearch = region
            ? REGION_FILES.filter((r) => r.label === region)
            : REGION_FILES;

        // Fetch and parse any uncached files in parallel
        await Promise.all(
            filesToSearch
                .filter((r) => !contentCache[r.file])
                .map(async (r) => {
                    try {
                        const res = await fetch(`regions/${r.file}`);
                        contentCache[r.file] = res.ok
                            ? parseRegion(await res.text(), r.label)
                            : [];
                    } catch {
                        contentCache[r.file] = [];
                    }
                })
        );

        // Multi-term AND matching (all terms must appear somewhere in the row)
        const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
        const results = [];

        for (const r of filesToSearch) {
            for (const entry of contentCache[r.file] || []) {
                const haystack = [entry.entry, entry.location, entry.church || '']
                    .join(' ')
                    .toLowerCase();
                if (terms.every((t) => haystack.includes(t))) {
                    results.push(entry);
                    if (results.length >= 200) break;
                }
            }
            if (results.length >= 200) break;
        }

        renderResults(q, results);
    }

    // -------------------------------------------------------------------------
    // Markdown parser — mirrors workers/search/populate.js parseRegionFile()
    // -------------------------------------------------------------------------
    function parseRegion(content, regionLabel) {
        const entries = [];
        const lines = content.split('\n');

        let currentLocation = '';
        let currentChurch = '';
        let currentEntry = '';

        function flush() {
            if (currentEntry.trim()) {
                entries.push({
                    region: regionLabel,
                    location: currentLocation.trim(),
                    church: currentChurch.trim() || null,
                    entry: currentEntry.trim(),
                });
            }
            currentEntry = '';
        }

        for (const rawLine of lines) {
            const line = rawLine.trimEnd();
            if (!line.trim()) continue;

            const indent = line.length - line.trimStart().length;
            const stripped = line.trimStart();

            if (stripped.startsWith('- ')) {
                const text = stripped.slice(2).trim();
                if (indent === 0) {
                    // Top-level list item → church
                    flush();
                    currentChurch = text;
                } else {
                    // Nested list item → saint entry
                    flush();
                    currentEntry = text;
                }
            } else if (indent > 2 && currentEntry) {
                // Continuation line of current entry: indent > 2 because nested
                // list items start with "  - " (2-space indent + "- "), so any
                // further-indented non-list line that follows belongs to that entry.
                currentEntry += ' ' + stripped;
            } else {
                // Plain paragraph → location
                flush();
                currentChurch = '';
                currentLocation = line.trim();
            }
        }
        flush();
        return entries;
    }

    // -------------------------------------------------------------------------
    // Render results
    // -------------------------------------------------------------------------
    function renderResults(query, results) {
        if (!results || results.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <p>No results found for <strong>${escapeHtml(query)}</strong>.</p>
                </div>`;
            return;
        }

        const count = results.length;
        const capped = count >= 200;
        let html = `<p class="search-summary">${capped ? '200+' : count} result${count !== 1 ? 's' : ''} for <strong>${escapeHtml(query)}</strong></p>`;
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

