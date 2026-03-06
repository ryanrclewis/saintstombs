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

const ALLOWED_ORIGINS = [
  'https://saintstombs.com',
  // HTTP is intentionally allowed for localhost so local development works
  // without needing HTTPS certificates.
  /^https?:\/\/localhost(:\d+)?$/,
  /^https:\/\/[a-zA-Z0-9-]+\.pages\.dev$/,
];

function getCorsHeaders(request) {
  const origin = (request.headers.get('Origin') || '').trim();
  const allowed = ALLOWED_ORIGINS.some((p) =>
    typeof p === 'string' ? p === origin : p.test(origin)
  );
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://saintstombs.com',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request, env) {
    const corsHeaders = getCorsHeaders(request);

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return json({ status: 'ok' }, 200, corsHeaders);
    }

    if (url.pathname === '/regions') {
      return handleRegions(env, corsHeaders);
    }

    if (url.pathname === '/search') {
      return handleSearch(url, env, corsHeaders);
    }

    return json({ error: 'Not found' }, 404, corsHeaders);
  },
};

// ---------------------------------------------------------------------------
// /regions
// ---------------------------------------------------------------------------
async function handleRegions(env, corsHeaders) {
  const { results } = await env.DB.prepare(
    'SELECT DISTINCT region FROM saints ORDER BY region'
  ).all();
  return json({ regions: results.map((r) => r.region) }, 200, corsHeaders);
}

// ---------------------------------------------------------------------------
// /search
// ---------------------------------------------------------------------------
async function handleSearch(url, env, corsHeaders) {
  const q = (url.searchParams.get('q') || '').trim();
  const region = (url.searchParams.get('region') || '').trim();
  const limitParam = parseInt(url.searchParams.get('limit') || '50', 10);
  const limit = isNaN(limitParam) ? 50 : Math.min(limitParam, 200);

  if (!q) {
    return json({ error: 'Missing query parameter "q"' }, 400, corsHeaders);
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
  return json({ query: q, region: region || null, results }, 200, corsHeaders);
}

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function json(data, status = 200, corsHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders,
    },
  });
}
