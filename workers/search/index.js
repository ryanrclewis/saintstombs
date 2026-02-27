/**
 * SaintsTombs Search Worker
 *
 * Endpoints
 *   GET /search?q=<term>[&region=<region>][&limit=<n>]
 *   GET /regions          — list all distinct region values
 *   GET /health           — liveness probe
 *
 * Bound D1 database: DB  (configured in wrangler.toml)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://saintstombs.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return json({ status: 'ok' });
    }

    if (url.pathname === '/regions') {
      return handleRegions(env);
    }

    if (url.pathname === '/search') {
      return handleSearch(url, env);
    }

    return json({ error: 'Not found' }, 404);
  },
};

// ---------------------------------------------------------------------------
// /regions
// ---------------------------------------------------------------------------
async function handleRegions(env) {
  const { results } = await env.DB.prepare(
    'SELECT DISTINCT region FROM saints ORDER BY region'
  ).all();
  return json({ regions: results.map((r) => r.region) });
}

// ---------------------------------------------------------------------------
// /search
// ---------------------------------------------------------------------------
async function handleSearch(url, env) {
  const q = (url.searchParams.get('q') || '').trim();
  const region = (url.searchParams.get('region') || '').trim();
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200);

  if (!q) {
    return json({ error: 'Missing query parameter "q"' }, 400);
  }

  // FTS5 match expression — append * for prefix search
  const ftsQuery = q
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => `"${w.replace(/"/g, '""')}"*`)
    .join(' ');

  let stmt;
  if (region) {
    stmt = env.DB.prepare(
      `SELECT s.id, s.region, s.location, s.church, s.entry,
              rank AS score
       FROM saints_fts
       JOIN saints s ON saints_fts.rowid = s.id
       WHERE saints_fts MATCH ?1
         AND s.region = ?2
       ORDER BY rank
       LIMIT ?3`
    ).bind(ftsQuery, region, limit);
  } else {
    stmt = env.DB.prepare(
      `SELECT s.id, s.region, s.location, s.church, s.entry,
              rank AS score
       FROM saints_fts
       JOIN saints s ON saints_fts.rowid = s.id
       WHERE saints_fts MATCH ?1
       ORDER BY rank
       LIMIT ?2`
    ).bind(ftsQuery, limit);
  }

  const { results } = await stmt.all();
  return json({ query: q, region: region || null, results });
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
    },
  });
}
