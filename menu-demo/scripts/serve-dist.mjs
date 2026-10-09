// Static file server for the built app, implemented via Playwright route
// interception so no background process is needed.
//
// Used by the verification scripts: starting a long-lived dev server from the
// shell is fragile (it dies between sessions and, when backgrounded with
// Start-Process, blocks the tool call). Route interception keeps everything in
// one process and always serves the freshly built output.
import { readFileSync, existsSync } from 'node:fs'
import { join, extname } from 'node:path'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
}

export const ORIGIN = 'http://menudigitaly.local'

/**
 * Route every request on `page` to a file inside `root` (default `dist`).
 * Paths are absolute (`/images/x.webp`), matching how the built app refers to
 * its assets.
 */
export async function serveDist(page, root = 'dist') {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url())
    if (url.origin !== ORIGIN) return route.abort()

    let rel = decodeURIComponent(url.pathname)
    if (rel === '/' || rel === '') rel = '/index.html'
    // Defence in depth: never serve outside the dist folder.
    const file = join(root, rel)
    if (!existsSync(file)) {
      return route.fulfill({ status: 404, body: 'not found: ' + rel })
    }
    route.fulfill({
      status: 200,
      contentType: MIME[extname(file)] ?? 'application/octet-stream',
      body: readFileSync(file),
    })
  })
}

/** Open the built app at a given viewport. Returns { context, page }. */
export async function openApp(browser, { width, height, mobile = false, theme }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    locale: 'fa-IR',
  })
  const page = await context.newPage()
  await serveDist(page)

  // Seed the theme before the app boots. localStorage needs a loaded document,
  // so navigate once, write, then reload so main.tsx primes it pre-paint.
  await page.goto(ORIGIN + '/', { waitUntil: 'domcontentloaded' })
  await page.evaluate((t) => {
    localStorage.setItem('menudigitaly.theme.v1', t)
    localStorage.removeItem('menudigitaly.cart.v1')
  }, theme)
  await page.reload({ waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(700)

  return { context, page }
}