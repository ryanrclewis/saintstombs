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
      // Rewrite request to /admin/index.html
      const adminUrl = new URL(request.url)
      adminUrl.pathname = '/admin/index.html'
      return env.ASSETS.fetch(new Request(adminUrl.toString(), request))
    }

    return env.ASSETS.fetch(request)
  },
}
