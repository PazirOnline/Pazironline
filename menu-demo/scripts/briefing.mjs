// Theme briefing poster capture.
//
// Renders `briefing.html?theme=<id>` — which paints each poster inside that
// theme's own custom properties — and writes one PNG per theme. The screenshots
// embedded in the posters are the real demo captures from scripts/shoot.mjs.
import { chromium } from 'playwright'
import { mkdirSync, rmSync } from 'node:fs'

const BASE = process.env.BASE ?? 'http://127.0.0.1:5199'
const OUT = 'briefing'
const ONLY = process.env.ONLY
const WIDTH = 1200

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch()
const problems = []

for (const theme of ['noire', 'muse', 'minima', 'verde', 'pulse']) {
  if (ONLY && theme !== ONLY) continue

  const ctx = await browser.newContext({
    viewport: { width: WIDTH, height: 1200 },
    deviceScaleFactor: 2,
    locale: 'fa-IR',
  })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => problems.push(`${theme}: ${e}`))
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`${theme} console: ${m.text()}`)
  })

  await page.goto(`${BASE}/briefing.html?theme=${theme}`, { waitUntil: 'networkidle' })
  await page.waitForSelector('body[data-ready="true"]', { timeout: 15000 })

  // Wait for the embedded demo screenshots to actually decode; otherwise the
  // poster captures with empty frames.
  await page.evaluate(async () => {
    const imgs = Array.from(document.images)
    await Promise.all(
      imgs.map(
        (img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((res) => {
                img.addEventListener('load', res, { once: true })
                img.addEventListener('error', res, { once: true })
              }),
      ),
    )
    await document.fonts.ready
  })

  const broken = await page.evaluate(() =>
    Array.from(document.images)
      .filter((i) => !i.complete || i.naturalWidth === 0)
      .map((i) => i.getAttribute('src')),
  )
  for (const src of broken) problems.push(`${theme}: broken image ${src}`)

  const height = await page.evaluate(
    () => Math.ceil(document.querySelector('.poster').getBoundingClientRect().height),
  )
  await page.setViewportSize({ width: WIDTH, height })
  await page.waitForTimeout(400)

  const out = `${OUT}/${theme}.png`
  await page.screenshot({ path: out })
  console.log(`briefing: ${out}  (${WIDTH}x${height} @2x)`)

  await ctx.close()
}

await browser.close()
console.log('\nproblems:', problems.length ? problems : 'none')