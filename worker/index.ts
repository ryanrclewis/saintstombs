interface Env {
  ASSETS: Fetcher
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    // Health check
    if (url.pathname === '/api/health') {
      return Response.json({ ok: true, service: 'saints-mvp' })
    }

    // Serve the static admin shell at /admin and /admin/ by returning
    // the bundled admin index file so the SPA won't intercept the route.
    if (url.pathname === '/admin' || url.pathname === '/admin/') {
      // Rewrite request to /admin/index.html and fetch it directly as GET
      const adminUrl = new URL(request.url)
      adminUrl.pathname = '/admin/index.html'
      return env.ASSETS.fetch(adminUrl.toString(), { method: 'GET' })
    }

    return env.ASSETS.fetch(request)
  },
}
