export const runtime = 'edge';

export default async function handler(req, { env }) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get('q') || '';
  const region = url.searchParams.get('region') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  if (!q.trim()) {
    return Response.json({ results: [], total: 0, page, limit });
  }

  try {
    const db = env?.DB;
    if (!db) {
      return Response.json({ error: 'Database not available' }, { status: 503 });
    }

    let query, params;
    if (region) {
      query = `SELECT rowid, region, location, church, entry FROM saints_fts WHERE saints_fts MATCH ? AND region = ? ORDER BY rank LIMIT ? OFFSET ?`;
      params = [q, region, limit, offset];
    } else {
      query = `SELECT rowid, region, location, church, entry FROM saints_fts WHERE saints_fts MATCH ? ORDER BY rank LIMIT ? OFFSET ?`;
      params = [q, limit, offset];
    }

    const { results } = await db.prepare(query).bind(...params).all();

    let countQuery, countParams;
    if (region) {
      countQuery = `SELECT count(*) as total FROM saints_fts WHERE saints_fts MATCH ? AND region = ?`;
      countParams = [q, region];
    } else {
      countQuery = `SELECT count(*) as total FROM saints_fts WHERE saints_fts MATCH ?`;
      countParams = [q];
    }
    const { results: countResults } = await db.prepare(countQuery).bind(...countParams).all();
    const total = countResults[0]?.total || 0;

    return Response.json({ results, total, page, limit });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
