import { execSync } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'

const REGIONS_DIR = path.resolve(__dirname, 'content/saints/regions')
const PROJECT_ROOT = path.resolve(__dirname)

function readBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let body = ''
    req.on('data', (chunk) => (body += chunk))
    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function adminApiPlugin(): Plugin {
  return {
    name: 'admin-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/admin', async (req, res, next) => {
        res.setHeader('Content-Type', 'application/json')
        try {
          const url = new URL(req.url ?? '/', 'http://localhost')
          const pathname = url.pathname

          if (req.method === 'GET' && pathname === '/regions') {
            const entries = await fs.readdir(REGIONS_DIR)
            const files = entries
              .filter((f) => f.endsWith('.md'))
              .sort()
              .map((f) => ({ name: f, path: f }))
            res.end(JSON.stringify(files))
            return
          }

          if (req.method === 'GET' && pathname.startsWith('/regions/')) {
            const file = decodeURIComponent(pathname.replace('/regions/', ''))
            if (!file || file.includes('..') || !file.endsWith('.md')) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid filename' }))
              return
            }
            const content = await fs.readFile(path.join(REGIONS_DIR, file), 'utf8')
            res.end(JSON.stringify({ name: file, content }))
            return
          }

          if (req.method === 'PUT' && pathname.startsWith('/regions/')) {
            const file = decodeURIComponent(pathname.replace('/regions/', ''))
            if (!file || file.includes('..') || !file.endsWith('.md')) {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Invalid filename' }))
              return
            }
            const body = await readBody(req)
            const { content } = JSON.parse(body)
            if (typeof content !== 'string') {
              res.statusCode = 400
              res.end(JSON.stringify({ error: 'Missing content' }))
              return
            }
            await fs.writeFile(path.join(REGIONS_DIR, file), content, 'utf8')
            try {
              execSync('node scripts/build-saints-index.mjs', {
                cwd: PROJECT_ROOT,
                stdio: 'pipe',
              })
              res.end(JSON.stringify({ ok: true, rebuilt: true }))
            } catch (buildErr) {
              res.end(JSON.stringify({ ok: true, rebuilt: false, buildError: String(buildErr) }))
            }
            return
          }

          next()
        } catch (err) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: String(err) }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), adminApiPlugin()],
})
