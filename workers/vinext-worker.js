import { handleApiRoute, renderPage } from '../dist/server/entry.js';

function toRouteUrl(requestUrl) {
  return requestUrl.pathname + requestUrl.search;
}

let cachedManifest = null;

async function getClientManifest(env) {
  if (cachedManifest) {
    return cachedManifest;
  }

  if (!env?.ASSETS || typeof env.ASSETS.fetch !== 'function') {
    cachedManifest = {};
    return cachedManifest;
  }

  try {
    const manifestResponse = await env.ASSETS.fetch('https://assets.local/.vite/manifest.json');
    if (!manifestResponse.ok) {
      cachedManifest = {};
      return cachedManifest;
    }

    cachedManifest = await manifestResponse.json();
    return cachedManifest;
  } catch {
    cachedManifest = {};
    return cachedManifest;
  }
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
