import { createHash } from 'node:crypto'
import { readdirSync, statSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const SHELL_EXT = /\.(html|css|js|mjs|png|svg|webp|webmanifest|ico)$/i

function listShellFiles(dir: string, root: string): string[] {
  const out: string[] = []
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) {
      out.push(...listShellFiles(full, root))
      continue
    }
    if (name === 'sw.js') continue
    if (!SHELL_EXT.test(name)) continue
    const rel = `/${path.relative(root, full).split(path.sep).join('/')}`
    out.push(rel)
  }
  return out.sort()
}

function renderServiceWorker(precache: string[], version: string): string {
  return `/* CampList app-shell service worker (${version}). Generated at build. */
const CACHE = 'camplist-shell-${version}'
const PRECACHE = ${JSON.stringify(precache, null, 2)}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    await Promise.all(
      PRECACHE.map((url) => cache.add(url).catch(() => undefined)),
    )
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
    await self.clients.claim()
  })())
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname === '/sw.js') return

  event.respondWith((async () => {
    const cache = await caches.open(CACHE)

    if (request.mode === 'navigate') {
      try {
        const fresh = await fetch(request)
        if (fresh.ok) await cache.put('/index.html', fresh.clone())
        return fresh
      } catch {
        return (await cache.match('/index.html')) || (await cache.match('/')) || Response.error()
      }
    }

    const cached = await cache.match(request)
    if (cached) return cached

    try {
      const fresh = await fetch(request)
      if (fresh.ok) await cache.put(request, fresh.clone())
      return fresh
    } catch {
      return cached || Response.error()
    }
  })())
})
`
}

function camplistServiceWorker(): Plugin {
  let outDir = path.resolve(import.meta.dirname, 'dist')

  return {
    name: 'camplist-sw',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      const files = listShellFiles(outDir, outDir)
      const precache = Array.from(new Set(['/', '/index.html', ...files]))
      const version = createHash('sha256').update(precache.join('\n')).digest('hex').slice(0, 12)
      writeFileSync(path.join(outDir, 'sw.js'), renderServiceWorker(precache, version))
    },
  }
}

export default defineConfig({
  plugins: [react(), camplistServiceWorker()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@checklists': path.resolve(import.meta.dirname, '../checklists'),
    },
  },
})
