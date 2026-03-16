import { handleApiRoute, renderPage } from '../dist/server/entry.js';

function toRouteUrl(requestUrl) {
  return requestUrl.pathname + requestUrl.search;
}

let cachedManifest = null;

const MANIFEST_PATHS = [
  '/.vite/manifest.json',
  '/client/.vite/manifest.json',
];

async function getClientManifest(env) {
  if (cachedManifest) {
    return cachedManifest;
  }

  if (!env?.ASSETS || typeof env.ASSETS.fetch !== 'function') {
    cachedManifest = {};
    return cachedManifest;
  }

  for (const manifestPath of MANIFEST_PATHS) {
    try {
      const manifestResponse = await env.ASSETS.fetch(`https://assets.local${manifestPath}`);
      if (!manifestResponse.ok) {
        continue;
      }

      cachedManifest = await manifestResponse.json();
      return cachedManifest;
    } catch {
      // Try the next candidate path.
    }
  }

  cachedManifest = {};
  return cachedManifest;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const routeUrl = toRouteUrl(url);

    // Serve built static files when present, otherwise fall through to SSR/API handlers.
    if (env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
    }

    if (routeUrl.startsWith('/api/')) {
      return handleApiRoute(request, routeUrl);
    }

    const manifest = await getClientManifest(env);
    return renderPage(request, routeUrl, manifest, ctx);
  },
};
