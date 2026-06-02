interface Env {
  ASSETS: Fetcher
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  // e.g. "ryanrclewis/saintstombs"
  GITHUB_REPO: string
  // branch to read/commit to, defaults to "main"
  GITHUB_BRANCH?: string
}

const COOKIE_NAME = 'st_gh_token'
const REGIONS_PATH = 'regions'

// ── Cookie helpers ────────────────────────────────────────────────────────────

function getToken(request: Request): string | null {
  const cookie = request.headers.get('Cookie') ?? ''
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

function tokenCookie(token: string): string {
  // 8-hour session
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=28800`
}

function clearCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`
}

// ── GitHub API helper ─────────────────────────────────────────────────────────

function ghFetch(token: string, path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'SaintsTombs-Admin/1.0',
      ...(init.headers ?? {}),
    },
  })
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      return await handleRequest(request, env)
    } catch (err) {
      return new Response(JSON.stringify({ error: String(err) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  },
}

async function handleRequest(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)
    const { pathname } = url
    const branch = env.GITHUB_BRANCH ?? 'main'
    const repo = env.GITHUB_REPO ?? 'ryanrclewis/saintstombs'
    const clientId = env.GITHUB_CLIENT_ID ?? 'Ov23liHbFX1nCwXkvlU9'

    // ── Health ────────────────────────────────────────────
    if (pathname === '/api/health') {
      return Response.json({ ok: true, service: 'saints-mvp' })
    }

    // ── Auth: redirect to GitHub OAuth ───────────────────
    if (pathname === '/api/admin/auth/login') {
      const params = new URLSearchParams({
        client_id: clientId,
        scope: 'repo',
        redirect_uri: `${url.origin}/api/admin/auth/callback`,
        state: crypto.randomUUID(),
      })
      return Response.redirect(`https://github.com/login/oauth/authorize?${params}`, 302)
    }

    // ── Auth: OAuth callback ──────────────────────────────
    if (pathname === '/api/admin/auth/callback') {
      const code = url.searchParams.get('code')
      if (!code) return Response.redirect(`${url.origin}/admin?error=no_code`, 302)

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      })
      const tokenData = await tokenRes.json() as { access_token?: string; error?: string }

      if (!tokenData.access_token) {
        const reason = encodeURIComponent((tokenData as {error_description?: string}).error_description ?? tokenData.error ?? 'unknown')
        return Response.redirect(`${url.origin}/admin?error=auth_failed&reason=${reason}`, 302)
      }

      // Verify the user actually has push access to the repo before accepting
      const accessCheck = await ghFetch(tokenData.access_token, `/repos/${repo}`)
      if (!accessCheck.ok) {
        return Response.redirect(`${url.origin}/admin?error=no_repo_access`, 302)
      }
      const repoData = await accessCheck.json() as { permissions?: { push?: boolean } }
      if (!repoData.permissions?.push) {
        return Response.redirect(`${url.origin}/admin?error=no_push_access`, 302)
      }

      return new Response(null, {
        status: 302,
        headers: {
          Location: `${url.origin}/admin`,
          'Set-Cookie': tokenCookie(tokenData.access_token),
        },
      })
    }

    // ── Auth: logout ──────────────────────────────────────
    if (pathname === '/api/admin/auth/logout' && request.method === 'POST') {
      return new Response(null, {
        status: 302,
        headers: { Location: `${url.origin}/admin`, 'Set-Cookie': clearCookie() },
      })
    }

    // ── Auth: current user ────────────────────────────────
    if (pathname === '/api/admin/auth/me') {
      const token = getToken(request)
      if (!token) return Response.json({ user: null }, { status: 401 })

      const res = await ghFetch(token, '/user')
      if (!res.ok) {
        return new Response(JSON.stringify({ user: null }), {
          status: 401,
          headers: { 'Content-Type': 'application/json', 'Set-Cookie': clearCookie() },
        })
      }
      const { login, avatar_url, name } = await res.json() as {
        login: string
        avatar_url: string
        name: string | null
      }
      return Response.json({ user: { login, avatar_url, name: name ?? login } })
    }

    // ── File API (all require auth) ───────────────────────
    if (pathname.startsWith('/api/admin/regions')) {
      const token = getToken(request)
      if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

      // GET /api/admin/regions — list files from GitHub
      if (request.method === 'GET' && pathname === '/api/admin/regions') {
        const res = await ghFetch(token, `/repos/${repo}/contents/${REGIONS_PATH}?ref=${branch}`)
        if (!res.ok) return Response.json({ error: 'GitHub API error' }, { status: res.status })

        const items = await res.json() as Array<{ name: string; type: string }>
        const files = items
          .filter((f) => f.type === 'file' && f.name.endsWith('.md'))
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((f) => ({ name: f.name, path: f.name }))
        return Response.json(files)
      }

      // GET /api/admin/regions/:file — read file
      if (request.method === 'GET' && pathname.startsWith('/api/admin/regions/')) {
        const file = safeFilename(pathname.replace('/api/admin/regions/', ''))
        if (!file) return Response.json({ error: 'Invalid filename' }, { status: 400 })

        const res = await ghFetch(token, `/repos/${repo}/contents/${REGIONS_PATH}/${file}?ref=${branch}`)
        if (!res.ok) return Response.json({ error: 'File not found' }, { status: res.status })

        const data = await res.json() as { content: string; sha: string; name: string }
        // GitHub returns base64-encoded content with newlines
        const content = decodeBase64(data.content)
        return Response.json({ name: data.name, content, sha: data.sha })
      }

      // PUT /api/admin/regions/:file — commit file back to repo
      if (request.method === 'PUT' && pathname.startsWith('/api/admin/regions/')) {
        const file = safeFilename(pathname.replace('/api/admin/regions/', ''))
        if (!file) return Response.json({ error: 'Invalid filename' }, { status: 400 })

        const body = await request.json() as {
          content: string
          sha: string
          message?: string
        }
        if (typeof body.content !== 'string' || typeof body.sha !== 'string') {
          return Response.json({ error: 'Missing content or sha' }, { status: 400 })
        }

        // Get user info for commit authorship
        const userRes = await ghFetch(token, '/user')
        const ghUser = await userRes.json() as { login: string; name: string | null; email: string | null }
        const committerName = ghUser.name ?? ghUser.login
        const committerEmail = ghUser.email ?? `${ghUser.login}@users.noreply.github.com`

        const commitMessage = body.message?.trim() || `Update ${file} via SaintsTombs admin`

        const commitRes = await ghFetch(token, `/repos/${repo}/contents/${REGIONS_PATH}/${file}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: commitMessage,
            content: encodeBase64(body.content),
            sha: body.sha,
            branch,
            committer: { name: committerName, email: committerEmail },
          }),
        })

        if (!commitRes.ok) {
          const err = await commitRes.json() as { message?: string }
          return Response.json(
            { error: err.message ?? 'GitHub commit failed' },
            { status: commitRes.status },
          )
        }

        const result = await commitRes.json() as { commit: { sha: string; html_url: string } }
        return Response.json({
          ok: true,
          commit: result.commit.sha,
          url: result.commit.html_url,
        })
      }
    }

    return env.ASSETS.fetch(request)
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function safeFilename(raw: string): string | null {
  const file = decodeURIComponent(raw)
  if (!file || file.includes('..') || file.includes('/') || !file.endsWith('.md')) return null
  return file
}

function decodeBase64(encoded: string): string {
  const binary = atob(encoded.replace(/\n/g, ''))
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

function encodeBase64(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
}
