import manifest from '../dist/client/.vite/manifest.json';
import { handleApiRoute, renderPage } from '../dist/server/entry.js';

function toRouteUrl(requestUrl) {
  return requestUrl.pathname + requestUrl.search;
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

    return renderPage(request, routeUrl, manifest, ctx);
  },
};
