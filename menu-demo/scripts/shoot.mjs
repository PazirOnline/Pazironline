// Visual verification harness - not part of the shipped app.
// Captures every theme across the required viewport range so the design can be
// judged as a designer would, not as a unit test.
import { chromium } from 'playwright'
import { mkdirSync, rmSync } from 'node:fs'

const BASE = process.env.BASE ?? 'http://127.0.0.1:5199'
const OUT = 'shots'
const ONLY = process.env.ONLY

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

const THEMES = ['noire', 'muse', 'minima', 'verde', 'pulse']

/** Small phone, normal phone, large phone, tablet, desktop (brief §11). */
const VIEWPORTS = [
  { key: 'xs', width: 320, height: 640, mobile: true },
  { key: 'sm', width: 390, height: 844, mobile: true },
  { key: 'lg', width: 430, height: 932, mobile: true },
  { key: 'tab', width: 834, height: 1112, mobile: true },
  { key: 'desk', width: 1440, height: 900, mobile: false },
]

const wait = (ms) => new Promise((r) => setTimeout(r, ms))

const browser = await chromium.launch()
const pageErrors = []

/**
 * Pin the theme before the app boots.
 *
 * localStorage is unavailable on about:blank, so the first navigation loads the
 * origin, the value is written, and the page is reloaded so `primeTheme()` in
 * main.tsx picks it up before React mounts.
 */
async function bootTheme(page, id) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate((theme) => {
    localStorage.setItem('menudigitaly.theme.v1', theme)
    localStorage.removeItem('menudigitaly.cart.v1')
  }, id)
  await page.reload({ waitUntil: 'networkidle' })
}

async function openGallery(page) {
  await page.locator('button[aria-label="انتخاب ظاهر منو"]').click()
  await wait(700)
}

/**
 * Open the first available product and add it to the cart.
 *
 * Targets `data-cta` hooks rather than visible text: on MINIMA the cart sheet is
 * a full-bleed takeover, and a text-matched `button` locator can resolve to an
 * element behind the sheet's own scroll container, which then swallows the
 * click. Hooks make the target unambiguous across all five themes.
 */
async function addFirstProduct(page) {
  await page.evaluate(() => {
    document.getElementById('section-hot')?.scrollIntoView()
  })
  await wait(700)

  const card = page.locator('#section-hot button').filter({ hasText: 'تومان' }).first()
  await card.click()
  await wait(800)

  const add = page.locator('[data-cta="add-to-cart"]').first()
  await add.scrollIntoViewIfNeeded()
  await add.click()
  await wait(600)

  const open = page.locator('[data-cta="open-cart"]').first()
  if (await open.count()) {
    await open.scrollIntoViewIfNeeded()
    await open.click()
  }
  await wait(800)
}

async function shoot(page, name) {
  await page.screenshot({ path: `${OUT}/${name}.png` })
  console.log('shot:', name)
}

for (const theme of THEMES) {
  if (ONLY && theme !== ONLY) continue

  for (const vp of VIEWPORTS) {
    // Only the two representative phone sizes plus desktop get the full journey;
    // the extremes get hero + menu so breakpoints are covered without 100 shots.
    const full = vp.key === 'sm' || vp.key === 'desk'

    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: full ? 2 : 1,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      locale: 'fa-IR',
    })
    const page = await ctx.newPage()
    page.on('pageerror', (e) => pageErrors.push(`${theme}/${vp.key}: ${e}`))
    page.on('console', (msg) => {
      if (msg.type() === 'error') pageErrors.push(`${theme}/${vp.key} console: ${msg.text()}`)
    })

    await bootTheme(page, theme)
    await wait(900)

    await shoot(page, `${theme}-${vp.key}-1-hero`)

    await page.evaluate(() => window.scrollTo({ top: 700, behavior: 'instant' }))
    await wait(800)
    await shoot(page, `${theme}-${vp.key}-2-signature`)

    await page.evaluate(() => {
      document.getElementById('section-hot')?.scrollIntoView()
    })
    await wait(800)
    await shoot(page, `${theme}-${vp.key}-3-menu`)

    if (!full) {
      await ctx.close()
      continue
    }

    // Product sheet: addFirstProduct opens the sheet, shoots it, adds, and
    // opens the cart, so the two states are captured in order.
    const card = page.locator('#section-hot button').filter({ hasText: 'تومان' }).first()
    await card.click()
    await wait(800)
    await shoot(page, `${theme}-${vp.key}-4-product-sheet`)

    const add = page.locator('[data-cta="add-to-cart"]').first()
    await add.scrollIntoViewIfNeeded()
    await add.click()
    await wait(700)

    const open = page.locator('[data-cta="open-cart"]').first()
    await open.scrollIntoViewIfNeeded()
    await open.click()
    await wait(800)
    await shoot(page, `${theme}-${vp.key}-5-cart`)
    await page.keyboard.press('Escape')
    await wait(500)

    // Gallery
    await openGallery(page)
    await shoot(page, `${theme}-${vp.key}-6-gallery`)
    await page.keyboard.press('Escape')
    await wait(500)

    await ctx.close()
  }
}

// Cart persistence across reload (CR7 / C12).
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    locale: 'fa-IR',
  })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => pageErrors.push(`persistence: ${e}`))
  await bootTheme(page, 'noire')
  await wait(800)
  const card = page.locator('#section-hot button').filter({ hasText: 'تومان' }).first()
  await card.click()
  await wait(800)
  await page.locator('[data-cta="add-to-cart"]').first().click()
  await wait(700)
  const before = await page.evaluate(
    () => localStorage.getItem('menudigitaly.cart.v1') ?? '',
  )
  await page.reload({ waitUntil: 'networkidle' })
  await wait(900)
  const after = await page.evaluate(
    () => localStorage.getItem('menudigitaly.cart.v1') ?? '',
  )
  console.log('cart persisted:', before === after && before.length > 0 ? 'YES' : 'NO')
  await shoot(page, 'persist-after-reload')
  await ctx.close()
}

console.log('\npage errors:', pageErrors.length ? pageErrors : 'none')
await browser.close()